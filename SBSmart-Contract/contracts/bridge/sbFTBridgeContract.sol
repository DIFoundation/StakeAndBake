// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for sbFT token operations
interface ISbFTToken {
    function burn(address from, uint256 amount) external;
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title WrappedSbFTToken
 * @dev Wrapped version of sbFT token for destination chains
 */
contract WrappedSbFTToken is ERC20, Ownable {
    
    // Address of the bridge contract (only address that can mint/burn)
    address public bridgeContract;
    
    // Events
    event BridgeContractSet(address indexed bridgeContract);
    event TokensMinted(address indexed to, uint256 amount, uint256 totalSupply);
    event TokensBurned(address indexed from, uint256 amount, uint256 totalSupply);
    
    constructor(
        string memory name,
        string memory symbol,
        address _owner
    ) ERC20(name, symbol) Ownable(_owner) {
        // Start with 0 supply - tokens only minted through bridge
    }
    
    /**
     * @dev Set the bridge contract address (only owner can set)
     * @param _bridgeContract Address of the bridge contract
     */
    function setBridgeContract(address _bridgeContract) external onlyOwner {
        require(_bridgeContract != address(0), "Invalid bridge contract");
        bridgeContract = _bridgeContract;
        emit BridgeContractSet(_bridgeContract);
    }
    
    /**
     * @dev Mint wrapped sbFT tokens - only bridge contract can mint
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == bridgeContract, "Only bridge contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, totalSupply());
    }
    
    /**
     * @dev Burn wrapped sbFT tokens - only bridge contract can burn
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == bridgeContract, "Only bridge contract can burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, totalSupply());
    }
    
    /**
     * @dev Check if address is a holder
     * @param account Address to check
     * @return True if account holds wrapped sbFT tokens
     */
    function isHolder(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }
}

/**
 * @title SbFTBridge
 * @dev Universal bridge for sbFT tokens using LayerZero V2
 */
contract SbFTBridge is OApp, OAppOptionsType3, ReentrancyGuard {
    
    // Token addresses
    address public sbftToken;        // Original sbFT token (only on source chain)
    address public wrappedSbftToken; // Wrapped sbFT token (only on destination chains)
    
    // Bridge configuration
    bool public isSourceChain;       // True if this is the source chain
    uint256 public bridgeFee = 100;  // 1% bridge fee (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_BRIDGE_AMOUNT = 1e18; // 1 sbFT minimum
    
    // Bridge tracking
    mapping(bytes32 => bool) public processedMessages;
    uint256 public totalBridged;
    uint256 public totalReceived;
    uint256 public feesCollected;
    
    // Emergency pause
    bool public bridgePaused = false;
    
    // Message types for enforced options
    uint16 public constant BRIDGE_TOKENS = 1;
    uint16 public constant BRIDGE_BACK = 2;
    
    // Events
    event BridgeInitiated(
        address indexed user,
        uint32 indexed dstEid,
        uint256 amount,
        uint256 fee,
        bytes32 indexed messageId
    );
    
    event TokensReceived(
        address indexed user,
        uint32 indexed srcEid,
        uint256 amount,
        bytes32 indexed messageId
    );
    
    event BridgeFeeUpdated(uint256 newFee);
    event BridgePaused();
    event BridgeUnpaused();
    event TokenAddressSet(address indexed token, bool isSource);
    
    modifier whenNotPaused() {
        require(!bridgePaused, "Bridge is paused");
        _;
    }
    
    /**
     * @dev Constructor for LayerZero V2 bridge
     * @param _endpoint LayerZero V2 endpoint address
     * @param _owner Owner address
     * @param _isSourceChain True if deploying on source chain
     */
    constructor(
        address _endpoint,
        address _owner,
        bool _isSourceChain
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        isSourceChain = _isSourceChain;
    }
    
    /**
     * @dev Set token address (sbFT for source, wrapped for destination)
     * @param _token Token contract address
     */
    function setTokenAddress(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        
        if (isSourceChain) {
            sbftToken = _token;
        } else {
            wrappedSbftToken = _token;
        }
        
        emit TokenAddressSet(_token, isSourceChain);
    }
    
    /**
     * @dev Quote bridge fees
     * @param _dstEid Destination endpoint ID
     * @param _amount Amount to bridge
     * @param _options Additional options
     * @param _payInLzToken Whether to pay in ZRO token
     * @return fee MessagingFee struct
     */
    function quoteBridge(
        uint32 _dstEid,
        uint256 _amount,
        bytes calldata _options,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        // Create message payload
        bytes32 messageId = keccak256(abi.encodePacked(
            msg.sender,
            _amount,
            block.timestamp
        ));
        
        bytes memory message = abi.encode(
            msg.sender,
            _amount,
            messageId
        );
        
        // Get message type based on chain
        uint16 msgType = isSourceChain ? BRIDGE_TOKENS : BRIDGE_BACK;
        
        // Combine options with enforced options
        bytes memory combinedOptions = combineOptions(_dstEid, msgType, _options);
        
        return _quote(_dstEid, message, combinedOptions, _payInLzToken);
    }
    
    /**
     * @dev Bridge tokens to another chain
     * @param _dstEid Destination endpoint ID (uint32 for V2)
     * @param _amount Amount to bridge
     * @param _options Additional execution options
     */
    function bridgeTokens(
        uint32 _dstEid,
        uint256 _amount,
        bytes calldata _options
    ) external payable nonReentrant whenNotPaused {
        require(_amount >= MIN_BRIDGE_AMOUNT, "Amount below minimum");
        require(peers[_dstEid] != bytes32(0), "Destination not configured");
        
        uint256 netAmount = _amount;
        uint256 fee = 0;
        
        if (isSourceChain) {
            // Source chain: burn original tokens and apply fee
            require(sbftToken != address(0), "sbFT token not set");
            require(ISbFTToken(sbftToken).balanceOf(msg.sender) >= _amount, "Insufficient balance");
            
            // Calculate bridge fee
            fee = (_amount * bridgeFee) / BASIS_POINTS;
            netAmount = _amount - fee;
            
            // Burn tokens from user
            ISbFTToken(sbftToken).burn(msg.sender, _amount);
            
            totalBridged += _amount;
            feesCollected += fee;
        } else {
            // Destination chain: burn wrapped tokens (no fee for bridging back)
            require(wrappedSbftToken != address(0), "Wrapped token not set");
            require(IERC20(wrappedSbftToken).balanceOf(msg.sender) >= _amount, "Insufficient balance");
            
            // Burn wrapped tokens
            ISbFTToken(wrappedSbftToken).burn(msg.sender, _amount);
        }
        
        // Create message
        bytes32 messageId = keccak256(abi.encodePacked(
            msg.sender,
            _amount,
            block.timestamp,
            block.number
        ));
        
        bytes memory message = abi.encode(
            msg.sender,
            netAmount,
            messageId
        );
        
        // Determine message type
        uint16 msgType = isSourceChain ? BRIDGE_TOKENS : BRIDGE_BACK;
        
        // Send LayerZero V2 message
        _lzSend(
            _dstEid,
            message,
            combineOptions(_dstEid, msgType, _options),
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
        
        emit BridgeInitiated(msg.sender, _dstEid, _amount, fee, messageId);
    }
    
    /**
     * @dev Receive tokens from another chain (LayerZero V2)
     * @param _origin Origin information
     * @param _guid Global unique identifier
     * @param _message Encoded message
     * @param _executor Executor address
     * @param _extraData Additional data
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        // Decode message
        (address toAddress, uint256 amount, bytes32 messageId) = abi.decode(
            _message,
            (address, uint256, bytes32)
        );
        
        // Prevent replay attacks
        require(!processedMessages[messageId], "Message already processed");
        processedMessages[messageId] = true;
        
        if (isSourceChain) {
            // Source chain: mint original tokens back
            require(sbftToken != address(0), "sbFT token not set");
            ISbFTToken(sbftToken).mint(toAddress, amount);
        } else {
            // Destination chain: mint wrapped tokens
            require(wrappedSbftToken != address(0), "Wrapped token not set");
            ISbFTToken(wrappedSbftToken).mint(toAddress, amount);
        }
        
        totalReceived += amount;
        
        emit TokensReceived(toAddress, _origin.srcEid, amount, messageId);
    }
    
    /**
     * @dev Update bridge fee (only on source chain)
     * @param _newFee New fee in basis points (max 1000 = 10%)
     */
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        bridgeFee = _newFee;
        emit BridgeFeeUpdated(_newFee);
    }
    
    /**
     * @dev Emergency pause bridge
     */
    function pauseBridge() external onlyOwner {
        bridgePaused = true;
        emit BridgePaused();
    }
    
    /**
     * @dev Unpause bridge
     */
    function unpauseBridge() external onlyOwner {
        bridgePaused = false;
        emit BridgeUnpaused();
    }
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 _totalBridged,
        uint256 _totalReceived,
        uint256 _feesCollected
    ) {
        return (totalBridged, totalReceived, feesCollected);
    }
    
    /**
     * @dev Check if message has been processed
     * @param _messageId Message identifier
     * @return True if already processed
     */
    function isMessageProcessed(bytes32 _messageId) external view returns (bool) {
        return processedMessages[_messageId];
    }
}

/**
 * @title SbFTBridgeFactory
 * @dev Factory contract to deploy LayerZero V2 bridge contracts
 */
contract SbFTBridgeFactory is Ownable {
    
    // Events
    event BridgeDeployed(
        address indexed bridge,
        address indexed token,
        bool isSourceChain,
        uint32 indexed chainId
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Deploy bridge on source chain
     * @param _endpoint LayerZero V2 endpoint address
     * @param _sbftToken Original sbFT token address
     * @param _chainId Chain identifier for events
     * @return bridge Address of deployed bridge
     */
    function deploySourceBridge(
        address _endpoint,
        address _sbftToken,
        uint32 _chainId
    ) external onlyOwner returns (address bridge) {
        SbFTBridge bridgeContract = new SbFTBridge(_endpoint, msg.sender, true);
        bridgeContract.setTokenAddress(_sbftToken);
        
        emit BridgeDeployed(address(bridgeContract), _sbftToken, true, _chainId);
        return address(bridgeContract);
    }
    
    /**
     * @dev Deploy bridge on destination chain with wrapped token
     * @param _endpoint LayerZero V2 endpoint address
     * @param _tokenName Name for wrapped token
     * @param _tokenSymbol Symbol for wrapped token
     * @param _chainId Chain identifier for events
     * @return bridge Address of deployed bridge
     * @return wrappedToken Address of deployed wrapped token
     */
    function deployDestinationBridge(
        address _endpoint,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint32 _chainId
    ) external onlyOwner returns (address bridge, address wrappedToken) {
        // Deploy wrapped token
        WrappedSbFTToken wrapped = new WrappedSbFTToken(_tokenName, _tokenSymbol, msg.sender);
        
        // Deploy bridge
        SbFTBridge bridgeContract = new SbFTBridge(_endpoint, msg.sender, false);
        bridgeContract.setTokenAddress(address(wrapped));
        
        // Set bridge contract in wrapped token
        wrapped.setBridgeContract(address(bridgeContract));
        
        emit BridgeDeployed(address(bridgeContract), address(wrapped), false, _chainId);
        return (address(bridgeContract), address(wrapped));
    }
}