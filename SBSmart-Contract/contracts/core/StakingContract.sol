// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
 * @dev Simplified staking contract for XFI tokens with 1:1 sbFT conversion
 * @dev Features time-locked staking with rewards and fee collection
 */
contract StakingContract is Ownable, ReentrancyGuard {
    
    IERC20 public xfiToken;
    ISbFTToken public sbftToken;
    IStakeAndBakeNFT public masterNFT;
    
    // Staking parameters
    uint256 public constant STAKING_FEE = 100; // 1% fee (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_STAKE = 1e18; // Minimum 1 XFI
    
    // Time lock parameters
    uint256 public stakingLockPeriod = 7 days; // Default 7 days lock
    uint256 public constant MAX_LOCK_PERIOD = 365 days; // Maximum 1 year
    uint256 public constant MIN_LOCK_PERIOD = 1 days; // Minimum 1 day
    
    // Reward parameters
    uint256 public annualRewardRate = 800; // 8% APY (800 basis points)
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    
    // User staking info
    struct StakeInfo {
        uint256 stakedAmount;      // Amount of XFI staked
        uint256 sbftBalance;       // Amount of sbFT tokens received (1:1 with staked amount)
        uint256 lastRewardTime;    // Last time rewards were calculated
        uint256 pendingRewards;    // Unclaimed XFI rewards
        uint256 unlockTime;        // When this stake can be unstaked
        uint256 lockPeriod;        // Lock period for this stake
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // Total amounts
    uint256 public totalStaked;
    uint256 public totalFeesCollected;
    uint256 public minStake = MIN_STAKE;
    
    // Events for subgraph
    event Staked(address indexed user, uint256 xfiAmount, uint256 sbftAmount, uint256 fee, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 xfiAmount, uint256 sbftAmount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 amount);
    event FeeCollected(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event MinStakeUpdated(uint256 newMinStake);
    event LockPeriodUpdated(uint256 newLockPeriod);
    event UnstakeAttemptedEarly(address indexed user, uint256 unlockTime, uint256 currentTime);
    
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
     * @dev Update staking lock period
     * @param _newLockPeriod New lock period in seconds
     */
    function setStakingLockPeriod(uint256 _newLockPeriod) external onlyOwner {
        require(_newLockPeriod >= MIN_LOCK_PERIOD, "Lock period too short");
        require(_newLockPeriod <= MAX_LOCK_PERIOD, "Lock period too long");
        stakingLockPeriod = _newLockPeriod;
        emit LockPeriodUpdated(_newLockPeriod);
    }
    
    /**
     * @dev Check if user can unstake (lock period expired)
     * @param user Address of the user
     * @return canUnstake Whether user can unstake
     * @return timeRemaining Time remaining until unlock (0 if can unstake)
     */
    function canUnstake(address user) external view returns (bool canUnstake, uint256 timeRemaining) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.stakedAmount == 0) {
            return (false, 0);
        }
        
        if (block.timestamp >= userStake.unlockTime) {
            return (true, 0);
        } else {
            return (false, userStake.unlockTime - block.timestamp);
        }
    }
    
    /**
     * @dev Stake XFI tokens to receive sbFT tokens with time lock (1:1 conversion)
     * @param amount Amount of XFI tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= minStake, "Amount below minimum stake");
        require(xfiToken.balanceOf(msg.sender) >= amount, "Insufficient XFI balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Calculate fee and net amount
        uint256 fee = (amount * STAKING_FEE) / BASIS_POINTS;
        uint256 netAmount = amount - fee;
        
        // 1:1 conversion - sbFT amount equals net staked amount
        uint256 sbftAmount = netAmount;
        
        // Set unlock time
        uint256 unlockTime = block.timestamp + stakingLockPeriod;
        
        // Transfer XFI from user
        require(xfiToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update user stake info
        stakes[msg.sender].stakedAmount += netAmount;
        stakes[msg.sender].sbftBalance += sbftAmount;
        stakes[msg.sender].lastRewardTime = block.timestamp;
        stakes[msg.sender].unlockTime = unlockTime;
        stakes[msg.sender].lockPeriod = stakingLockPeriod;
        
        // Update totals
        totalStaked += netAmount;
        totalFeesCollected += fee;
        
        // Mint sbFT tokens to user (1:1 with net staked amount)
        sbftToken.mint(msg.sender, sbftAmount);
        
        // Send fee to Master NFT contract (if set)
        if (address(masterNFT) != address(0) && fee > 0) {
            require(xfiToken.transfer(address(masterNFT), fee), "Fee transfer failed");
            masterNFT.distributeFees(fee);
        }
        
        emit Staked(msg.sender, amount, sbftAmount, fee, unlockTime);
        emit FeeCollected(fee);
    }
    
    /**
     * @dev Unstake XFI tokens by burning sbFT tokens (only after lock period)
     * @param sbftAmount Amount of sbFT tokens to burn (1:1 conversion to XFI)
     */
    function unstake(uint256 sbftAmount) external nonReentrant {
        require(sbftAmount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].sbftBalance >= sbftAmount, "Insufficient sbFT balance");
        
        // Check if lock period has expired
        if (block.timestamp < stakes[msg.sender].unlockTime) {
            emit UnstakeAttemptedEarly(msg.sender, stakes[msg.sender].unlockTime, block.timestamp);
            revert("Tokens are still locked");
        }
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // 1:1 conversion - XFI amount equals sbFT amount
        uint256 xfiAmount = sbftAmount;
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
     * @dev Emergency unstake with penalty (for testing purposes)
     * @param sbftAmount Amount of sbFT tokens to burn
     * @param penaltyRate Penalty rate in basis points (e.g., 1000 = 10%)
     */
    function emergencyUnstake(uint256 sbftAmount, uint256 penaltyRate) external nonReentrant {
        require(sbftAmount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].sbftBalance >= sbftAmount, "Insufficient sbFT balance");
        require(penaltyRate <= 5000, "Penalty cannot exceed 50%");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // 1:1 conversion - XFI amount equals sbFT amount
        uint256 xfiAmount = sbftAmount;
        require(xfiAmount <= stakes[msg.sender].stakedAmount, "Invalid unstake amount");
        
        // Apply penalty
        uint256 penalty = (xfiAmount * penaltyRate) / BASIS_POINTS;
        uint256 netAmount = xfiAmount - penalty;
        
        // Update user stake info
        stakes[msg.sender].stakedAmount -= xfiAmount;
        stakes[msg.sender].sbftBalance -= sbftAmount;
        
        // Update totals
        totalStaked -= xfiAmount;
        totalFeesCollected += penalty;
        
        // Burn sbFT tokens
        sbftToken.burn(msg.sender, sbftAmount);
        
        // Transfer net amount back to user
        require(xfiToken.transfer(msg.sender, netAmount), "Transfer failed");
        
        // Send penalty to Master NFT contract (if set)
        if (address(masterNFT) != address(0) && penalty > 0) {
            require(xfiToken.transfer(address(masterNFT), penalty), "Penalty transfer failed");
            masterNFT.distributeFees(penalty);
        }
        
        emit Unstaked(msg.sender, netAmount, sbftAmount);
        emit FeeCollected(penalty);
    }
    
    /**
     * @dev Update minimum stake amount (only owner)
     * @param _newMinStake New minimum stake amount
     */
    function setMinStake(uint256 _newMinStake) external onlyOwner {
        require(_newMinStake > 0, "Min stake must be greater than 0");
        minStake = _newMinStake;
        emit MinStakeUpdated(_newMinStake);
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
     * @dev Compound rewards by staking them (extends lock period)
     */
    function compoundRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 rewards = stakes[msg.sender].pendingRewards;
        require(rewards > 0, "No rewards to compound");
        
        stakes[msg.sender].pendingRewards = 0;
        
        // 1:1 conversion for compounded rewards
        uint256 sbftAmount = rewards;
        
        stakes[msg.sender].stakedAmount += rewards;
        stakes[msg.sender].sbftBalance += sbftAmount;
        totalStaked += rewards;
        
        // Extend lock period when compounding
        stakes[msg.sender].unlockTime = block.timestamp + stakingLockPeriod;
        
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
     * @dev Get current minimum stake amount
     * @return Current minimum stake in wei
     */
    function getMinStake() external view returns (uint256) {
        return minStake;
    }
    
    /**
     * @dev Get current lock period
     * @return Current staking lock period in seconds
     */
    function getCurrentLockPeriod() external view returns (uint256) {
        return stakingLockPeriod;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalStaked_ Total amount of XFI staked
     * @return totalFeesCollected_ Total fees collected
     * @return currentRewardRate Current annual reward rate in basis points
     */
    function getContractStats() external view returns (
        uint256 totalStaked_,
        uint256 totalFeesCollected_,
        uint256 currentRewardRate
    ) {
        return (totalStaked, totalFeesCollected, annualRewardRate);
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