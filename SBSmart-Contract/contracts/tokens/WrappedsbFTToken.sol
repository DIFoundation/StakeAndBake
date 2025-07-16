// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



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
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
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
