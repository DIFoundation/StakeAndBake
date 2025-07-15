// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISbFTToken {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title StakeAndBakeNFT
 * @dev Master NFT contract that collects protocol revenue and distributes to sbFT holders
 */
contract StakeAndBakeNFT is ERC721, Ownable, ReentrancyGuard {
    
    IERC20 public xfiToken;
    ISbFTToken public sbftToken;
    address public stakingContract;
    
    // Revenue distribution parameters
    uint256 public constant DISTRIBUTION_PERIOD = 7 days; // Weekly distribution
    uint256 public lastDistributionTime;
    uint256 public accumulatedRevenue;
    
    // Distribution tracking
    struct DistributionRound {
        uint256 totalRevenue;
        uint256 totalSbftSupply;
        uint256 timestamp;
        uint256 revenuePerToken;
    }
    
    mapping(uint256 => DistributionRound) public distributionRounds;
    mapping(address => uint256) public lastClaimedRound;
    uint256 public currentRound;
    
    // NFT metadata
    string private _tokenURI;
    bool public nftMinted = false;
    
    // Events for subgraph
    event RevenueReceived(uint256 amount, uint256 totalAccumulated);
    event RevenueDistributed(uint256 round, uint256 totalRevenue, uint256 totalSbftSupply);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 round);
    event MasterNFTMinted(address indexed to, uint256 tokenId);
    event StakingContractSet(address indexed stakingContract);
    
    constructor(
        string memory name,
        string memory symbol,
        address _xfiToken,
        address _sbftToken,
        string memory _tokenURIParam
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_xfiToken != address(0), "Invalid XFI token");
        require(_sbftToken != address(0), "Invalid sbFT token");
        
        xfiToken = IERC20(_xfiToken);
        sbftToken = ISbFTToken(_sbftToken);
        _tokenURI = _tokenURIParam;
        lastDistributionTime = block.timestamp;
    }
    
    /**
     * @dev Set staking contract address (only owner)
     * @param _stakingContract Address of the staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid staking contract");
        stakingContract = _stakingContract;
        emit StakingContractSet(_stakingContract);
    }
    
    /**
     * @dev Mint the Master NFT (only once)
     * @param to Address to mint the NFT to
     */
    function mintMasterNFT(address to) external onlyOwner {
        require(!nftMinted, "Master NFT already minted");
        require(to != address(0), "Cannot mint to zero address");
        
        _safeMint(to, 1);
        nftMinted = true;
        
        emit MasterNFTMinted(to, 1);
    }
    
    /**
     * @dev Receive fees from staking contract
     * @param amount Amount of XFI fees received
     */
    function distributeFees(uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can send fees");
        require(amount > 0, "Amount must be greater than 0");
        
        accumulatedRevenue += amount;
        
        emit RevenueReceived(amount, accumulatedRevenue);
    }
    
    /**
     * @dev Distribute accumulated revenue to sbFT holders (weekly)
     */
    function distributeRevenue() external {
        require(block.timestamp >= lastDistributionTime + DISTRIBUTION_PERIOD, "Distribution period not reached");
        require(accumulatedRevenue > 0, "No revenue to distribute");
        
        uint256 totalSbftSupply = sbftToken.totalSupply();
        require(totalSbftSupply > 0, "No sbFT tokens in circulation");
        
        // Create new distribution round
        currentRound++;
        uint256 revenuePerToken = (accumulatedRevenue * 1e18) / totalSbftSupply;
        
        distributionRounds[currentRound] = DistributionRound({
            totalRevenue: accumulatedRevenue,
            totalSbftSupply: totalSbftSupply,
            timestamp: block.timestamp,
            revenuePerToken: revenuePerToken
        });
        
        emit RevenueDistributed(currentRound, accumulatedRevenue, totalSbftSupply);
        
        // Reset for next round
        accumulatedRevenue = 0;
        lastDistributionTime = block.timestamp;
    }
    
    /**
     * @dev Claim revenue rewards for multiple rounds
     * @param rounds Array of rounds to claim from
     */
    function claimRewards(uint256[] calldata rounds) external nonReentrant {
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < rounds.length; i++) {
            uint256 round = rounds[i];
            require(round <= currentRound, "Round does not exist");
            require(round > lastClaimedRound[msg.sender], "Round already claimed");
            
            DistributionRound memory dist = distributionRounds[round];
            uint256 userSbftBalance = sbftToken.balanceOf(msg.sender);
            
            if (userSbftBalance > 0) {
                uint256 reward = (userSbftBalance * dist.revenuePerToken) / 1e18;
                totalRewards += reward;
                
                emit RewardsClaimed(msg.sender, reward, round);
            }
        }
        
        require(totalRewards > 0, "No rewards to claim");
        
        // Update last claimed round
        if (rounds.length > 0) {
            lastClaimedRound[msg.sender] = rounds[rounds.length - 1];
        }
        
        // Transfer rewards to user
        require(xfiToken.transfer(msg.sender, totalRewards), "Reward transfer failed");
    }
    
    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return totalRewards Total pending rewards
     */
    function getPendingRewards(address user) external view returns (uint256 totalRewards) {
        uint256 userSbftBalance = sbftToken.balanceOf(user);
        if (userSbftBalance == 0) return 0;
        
        uint256 lastClaimed = lastClaimedRound[user];
        
        for (uint256 round = lastClaimed + 1; round <= currentRound; round++) {
            DistributionRound memory dist = distributionRounds[round];
            uint256 reward = (userSbftBalance * dist.revenuePerToken) / 1e18;
            totalRewards += reward;
        }
    }
    
    /**
     * @dev Get claimable rounds for a user
     * @param user Address of the user
     * @return rounds Array of rounds user can claim from
     */
    function getClaimableRounds(address user) external view returns (uint256[] memory rounds) {
        uint256 lastClaimed = lastClaimedRound[user];
        uint256 claimableCount = currentRound - lastClaimed;
        
        if (claimableCount == 0) {
            return new uint256[](0);
        }
        
        rounds = new uint256[](claimableCount);
        for (uint256 i = 0; i < claimableCount; i++) {
            rounds[i] = lastClaimed + i + 1;
        }
    }
    
    /**
     * @dev Get distribution round information
     * @param round Round number
     * @return Distribution round details
     */
    function getDistributionRound(uint256 round) external view returns (DistributionRound memory) {
        return distributionRounds[round];
    }
    
    /**
     * @dev Check if distribution is due
     * @return True if distribution can be triggered
     */
    function isDistributionDue() external view returns (bool) {
        return block.timestamp >= lastDistributionTime + DISTRIBUTION_PERIOD && accumulatedRevenue > 0;
    }
    
    /**
     * @dev Get time until next distribution
     * @return Seconds until next distribution can happen
     */
    function getTimeUntilNextDistribution() external view returns (uint256) {
        uint256 nextDistribution = lastDistributionTime + DISTRIBUTION_PERIOD;
        if (block.timestamp >= nextDistribution) {
            return 0;
        }
        return nextDistribution - block.timestamp;
    }
    
    /**
     * @dev Get token URI for the Master NFT
     * @param tokenId Token ID (should be 1)
     * @return Token URI string
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId == 1, "Token does not exist");
        return _tokenURI;
    }
    
    /**
     * @dev Update token URI (only owner)
     * @param newTokenURI New token URI
     */
    function setTokenURI(string memory newTokenURI) external onlyOwner {
        _tokenURI = newTokenURI;
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = xfiToken.balanceOf(address(this));
        require(xfiToken.transfer(owner(), balance), "Emergency withdraw failed");
    }
}