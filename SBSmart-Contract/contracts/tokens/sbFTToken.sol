// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SbFTToken
 * @dev Fractional tokens representing ownership of Master NFT in Stake and Bake protocol
 */
contract SbFTToken is ERC20, Ownable {
    
    // Address of the staking contract (only address that can mint/burn)
    address public stakingContract;
    
    // Events for subgraph
    event StakingContractSet(address indexed stakingContract);
    event TokensMinted(address indexed to, uint256 amount, uint256 totalSupply);
    event TokensBurned(address indexed from, uint256 amount, uint256 totalSupply);
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // Start with 0 supply - tokens only minted through staking
    }
    
    /**
     * @dev Set the staking contract address (only owner can set)
     * @param _stakingContract Address of the staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid staking contract");
        stakingContract = _stakingContract;
        emit StakingContractSet(_stakingContract);
    }
    
    /**
     * @dev Mint sbFT tokens - only staking contract can mint
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, totalSupply());
    }
    
    /**
     * @dev Burn sbFT tokens - only staking contract can burn
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, totalSupply());
    }
    
    /**
     * @dev Get all holders (for royalty distribution) - simplified for hackathon
     * @return holders Array of addresses that hold sbFT tokens
     */
    function getHolders() external pure returns (address[] memory holders) {
        // Note: This is a simplified version for hackathon
        // In production, you'd want to use a more efficient method
        // For now, this will be handled by the subgraph
        holders = new address[](0);
    }
    
    /**
     * @dev Check if address is a holder
     * @param account Address to check
     * @return True if account holds sbFT tokens
     */
    function isHolder(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }
}