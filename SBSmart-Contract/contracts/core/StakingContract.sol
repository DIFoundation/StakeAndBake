// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISbFTToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

interface IStakeAndBakeNFT {
    function distributeFees(uint256 amount) external;
}

/**
 * @title StakingContract
 * @dev Main contract for staking XFI tokens and receiving sbFT fractional tokens
 */
contract StakingContract is Ownable, ReentrancyGuard {
    
    IERC20 public xfiToken;
    ISbFTToken public sbftToken;
    IStakeAndBakeNFT public masterNFT;
    
    // Staking parameters
    uint256 public constant CONVERSION_RATE = 1; // 1 XFI = 1 sbFT (can be adjusted)
    uint256 public constant STAKING_FEE = 100; // 1% fee (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_STAKE = 1e18; // Minimum 1 XFI
    
    // Reward parameters
    uint256 public annualRewardRate = 800; // 8% APY (800 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // User staking info
    struct StakeInfo {
        uint256 stakedAmount;      // Amount of XFI staked
        uint256 sbftBalance;       // Amount of sbFT tokens received
        uint256 lastRewardTime;    // Last time rewards were calculated
        uint256 pendingRewards;    // Unclaimed XFI rewards
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // Total amounts
    uint256 public totalStaked;
    uint256 public totalFeesCollected;
    
    // Events for subgraph
    event Staked(address indexed user, uint256 xfiAmount, uint256 sbftAmount, uint256 fee);
    event Unstaked(address indexed user, uint256 xfiAmount, uint256 sbftAmount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 amount);
    event FeeCollected(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    
    constructor(
        address _xfiToken,
        address _sbftToken
    ) Ownable(msg.sender) {
        require(_xfiToken != address(0), "Invalid XFI token");
        require(_sbftToken != address(0), "Invalid sbFT token");
        
        xfiToken = IERC20(_xfiToken);
        sbftToken = ISbFTToken(_sbftToken);
    }
    
    /**
     * @dev Set Master NFT contract address
     * @param _masterNFT Address of the Master NFT contract
     */
    function setMasterNFT(address _masterNFT) external onlyOwner {
        require(_masterNFT != address(0), "Invalid Master NFT address");
        masterNFT = IStakeAndBakeNFT(_masterNFT);
    }
    
    /**
     * @dev Stake XFI tokens to receive sbFT tokens
     * @param amount Amount of XFI tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= MIN_STAKE, "Amount below minimum stake");
        require(xfiToken.balanceOf(msg.sender) >= amount, "Insufficient XFI balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Calculate fee and net amount
        uint256 fee = (amount * STAKING_FEE) / BASIS_POINTS;
        uint256 netAmount = amount - fee;
        
        // Calculate sbFT tokens to mint
        uint256 sbftAmount = (netAmount * CONVERSION_RATE);
        
        // Transfer XFI from user
        require(xfiToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update user stake info
        stakes[msg.sender].stakedAmount += netAmount;
        stakes[msg.sender].sbftBalance += sbftAmount;
        stakes[msg.sender].lastRewardTime = block.timestamp;
        
        // Update totals
        totalStaked += netAmount;
        totalFeesCollected += fee;
        
        // Mint sbFT tokens to user
        sbftToken.mint(msg.sender, sbftAmount);
        
        // Send fee to Master NFT contract (if set)
        if (address(masterNFT) != address(0) && fee > 0) {
            require(xfiToken.transfer(address(masterNFT), fee), "Fee transfer failed");
            masterNFT.distributeFees(fee);
        }
        
        emit Staked(msg.sender, amount, sbftAmount, fee);
        emit FeeCollected(fee);
    }
    
    /**
     * @dev Unstake XFI tokens by burning sbFT tokens
     * @param sbftAmount Amount of sbFT tokens to burn
     */
    function unstake(uint256 sbftAmount) external nonReentrant {
        require(sbftAmount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].sbftBalance >= sbftAmount, "Insufficient sbFT balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Calculate XFI amount to return
        uint256 xfiAmount = sbftAmount / CONVERSION_RATE;
        require(xfiAmount <= stakes[msg.sender].stakedAmount, "Invalid unstake amount");
        
        // Update user stake info
        stakes[msg.sender].stakedAmount -= xfiAmount;
        stakes[msg.sender].sbftBalance -= sbftAmount;
        
        // Update totals
        totalStaked -= xfiAmount;
        
        // Burn sbFT tokens
        sbftToken.burn(msg.sender, sbftAmount);
        
        // Transfer XFI back to user
        require(xfiToken.transfer(msg.sender, xfiAmount), "Transfer failed");
        
        emit Unstaked(msg.sender, xfiAmount, sbftAmount);
    }
    
    /**
     * @dev Claim accumulated staking rewards
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 rewards = stakes[msg.sender].pendingRewards;
        require(rewards > 0, "No rewards to claim");
        
        stakes[msg.sender].pendingRewards = 0;
        
        // Transfer rewards to user
        require(xfiToken.transfer(msg.sender, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Compound rewards by staking them
     */
    function compoundRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 rewards = stakes[msg.sender].pendingRewards;
        require(rewards > 0, "No rewards to compound");
        
        stakes[msg.sender].pendingRewards = 0;
        
        // Stake the rewards (no fee for compounding)
        uint256 sbftAmount = rewards * CONVERSION_RATE;
        
        stakes[msg.sender].stakedAmount += rewards;
        stakes[msg.sender].sbftBalance += sbftAmount;
        totalStaked += rewards;
        
        // Mint additional sbFT tokens
        sbftToken.mint(msg.sender, sbftAmount);
        
        emit RewardsCompounded(msg.sender, rewards);
    }
    
    /**
     * @dev Update reward rate (only owner)
     * @param newRate New annual reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate cannot exceed 20%"); // Max 20% APY
        annualRewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    /**
     * @dev Get user's pending rewards
     * @param user Address of the user
     * @return Pending rewards in XFI
     */
    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.stakedAmount == 0) return userStake.pendingRewards;
        
        uint256 timeDiff = block.timestamp - userStake.lastRewardTime;
        uint256 newRewards = (userStake.stakedAmount * annualRewardRate * timeDiff) / 
                           (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return userStake.pendingRewards + newRewards;
    }
    
    /**
     * @dev Get user's stake information
     * @param user Address of the user
     * @return StakeInfo struct with user's staking details
     */
    function getUserStake(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }
    
    /**
     * @dev Internal function to update user rewards
     * @param user Address of the user
     */
    function _updateRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        
        if (userStake.stakedAmount > 0) {
            uint256 timeDiff = block.timestamp - userStake.lastRewardTime;
            uint256 newRewards = (userStake.stakedAmount * annualRewardRate * timeDiff) / 
                               (BASIS_POINTS * SECONDS_PER_YEAR);
            
            userStake.pendingRewards += newRewards;
        }
        
        userStake.lastRewardTime = block.timestamp;
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = xfiToken.balanceOf(address(this));
        require(xfiToken.transfer(owner(), balance), "Emergency withdraw failed");
    }
}