// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 * @dev Uses 6 decimals like real USDC
 */
contract MockUSDC is ERC20, Ownable {
    
    uint8 private _decimals = 6; // USDC uses 6 decimals
    
    // Faucet parameters
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**6; // 1000 USDC
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    mapping(address => uint256) public lastFaucetTime;
    
    event FaucetUsed(address indexed user, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("STAKEBAKE USDC", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }
    
    /**
     * @dev Returns the number of decimals used for token amounts
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Faucet function - allows users to get free USDC for testing
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not finished"
        );
        
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetUsed(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Check if user can use faucet
     * @param user Address to check
     * @return canUse Whether user can use faucet
     * @return timeRemaining Time remaining until next faucet use (0 if can use)
     */
    function canUseFaucet(address user) external view returns (bool canUse, uint256 timeRemaining) {
        uint256 nextFaucetTime = lastFaucetTime[user] + FAUCET_COOLDOWN;
        
        if (block.timestamp >= nextFaucetTime) {
            return (true, 0);
        } else {
            return (false, nextFaucetTime - block.timestamp);
        }
    }
    
    /**
     * @dev Mint tokens to specific address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Mint tokens to multiple addresses (only owner)
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts to mint
     */
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Emergency function to mint tokens for testing
     * @param amount Amount of tokens to mint to caller
     */
    function emergencyMint(uint256 amount) external {
        require(amount <= 10000 * 10**6, "Amount too large"); // Max 10K USDC per call
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }
}