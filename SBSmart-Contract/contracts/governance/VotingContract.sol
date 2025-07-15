// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISbFTToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title VotingContract
 * @dev Simple governance voting using sbFT tokens as voting power
 */
contract VotingContract is Ownable, ReentrancyGuard {
    
    ISbFTToken public sbftToken;
    
    // Voting parameters
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_SBFT_TO_PROPOSE = 1000e18; // 1000 sbFT minimum
    uint256 public constant QUORUM_PERCENTAGE = 1000; // 10% quorum (1000 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVotingPower; // Total sbFT supply at proposal creation
        bool executed;
        bool passed;
        ProposalType proposalType;
    }
    
    enum ProposalType {
        REWARD_RATE_CHANGE,    // Change staking reward rate
        FEE_CHANGE,            // Change staking fee
        PARAMETER_CHANGE,      // Change other protocol parameters
        GENERAL                // General governance proposal
    }
    
    // Vote structure
    struct Vote {
        bool support;          // true = yes, false = no
        uint256 votingPower;   // sbFT balance at time of vote
        uint256 timestamp;
    }
    
    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    uint256 public proposalCount;
    uint256[] public activeProposals;
    
    // Events for subgraph
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed proposer,
        uint256 startTime,
        uint256 endTime,
        ProposalType proposalType
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool passed,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVotingPower
    );
    
    event ProposalCanceled(uint256 indexed proposalId);
    
    constructor(address _sbftToken) Ownable(msg.sender) {
        require(_sbftToken != address(0), "Invalid sbFT token");
        sbftToken = ISbFTToken(_sbftToken);
    }
    
    /**
     * @dev Create a new proposal
     * @param title Title of the proposal
     * @param description Description of the proposal
     * @param proposalType Type of proposal
     */
    function createProposal(
        string calldata title,
        string calldata description,
        ProposalType proposalType
    ) external {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(sbftToken.balanceOf(msg.sender) >= MIN_SBFT_TO_PROPOSE, "Insufficient sbFT to propose");
        
        uint256 proposalId = proposalCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;
        uint256 totalVotingPower = sbftToken.totalSupply();
        
        require(totalVotingPower > 0, "No sbFT tokens in circulation");
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            proposer: msg.sender,
            startTime: startTime,
            endTime: endTime,
            yesVotes: 0,
            noVotes: 0,
            totalVotingPower: totalVotingPower,
            executed: false,
            passed: false,
            proposalType: proposalType
        });
        
        activeProposals.push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            title,
            msg.sender,
            startTime,
            endTime,
            proposalType
        );
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        require(proposalId < proposalCount, "Proposal does not exist");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");
        
        uint256 votingPower = sbftToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");
        
        // Record the vote
        votes[proposalId][msg.sender] = Vote({
            support: support,
            votingPower: votingPower,
            timestamp: block.timestamp
        });
        
        hasVoted[proposalId][msg.sender] = true;
        
        // Update proposal vote counts
        if (support) {
            proposal.yesVotes += votingPower;
        } else {
            proposal.noVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @dev Execute a proposal after voting period ends
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Calculate results
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        uint256 quorumRequired = (proposal.totalVotingPower * QUORUM_PERCENTAGE) / BASIS_POINTS;
        
        bool quorumMet = totalVotes >= quorumRequired;
        bool majorityYes = proposal.yesVotes > proposal.noVotes;
        
        proposal.executed = true;
        proposal.passed = quorumMet && majorityYes;
        
        // Remove from active proposals
        _removeFromActiveProposals(proposalId);
        
        emit ProposalExecuted(
            proposalId,
            proposal.passed,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotingPower
        );
    }
    
    /**
     * @dev Cancel a proposal (only proposer or owner)
     * @param proposalId ID of the proposal
     */
    function cancelProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        
        proposal.executed = true;
        proposal.passed = false;
        
        // Remove from active proposals
        _removeFromActiveProposals(proposalId);
        
        emit ProposalCanceled(proposalId);
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     * @return Proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId < proposalCount, "Proposal does not exist");
        return proposals[proposalId];
    }
    
    /**
     * @dev Get vote details for a user on a proposal
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     * @return Vote details
     */
    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }
    
    /**
     * @dev Get all active proposal IDs
     * @return Array of active proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        return activeProposals;
    }
    
    /**
     * @dev Get proposal results
     * @param proposalId ID of the proposal
     * @return yesVotes Number of yes votes
     * @return noVotes Number of no votes
     * @return totalVotingPower Total voting power when proposal was created
     * @return quorumMet Whether quorum was met
     * @return passed Whether proposal passed
     */
    function getProposalResults(uint256 proposalId) external view returns (
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVotingPower,
        bool quorumMet,
        bool passed
    ) {
        require(proposalId < proposalCount, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        uint256 quorumRequired = (proposal.totalVotingPower * QUORUM_PERCENTAGE) / BASIS_POINTS;
        
        return (
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotingPower,
            totalVotes >= quorumRequired,
            proposal.passed
        );
    }
    
    /**
     * @dev Check if a proposal can be executed
     * @param proposalId ID of the proposal
     * @return True if proposal can be executed
     */
    function canExecuteProposal(uint256 proposalId) external view returns (bool) {
        if (proposalId >= proposalCount) return false;
        
        Proposal storage proposal = proposals[proposalId];
        return block.timestamp > proposal.endTime && !proposal.executed;
    }
    
    /**
     * @dev Get user's voting power for current proposals
     * @param user Address of the user
     * @return Current sbFT balance (voting power)
     */
    function getVotingPower(address user) external view returns (uint256) {
        return sbftToken.balanceOf(user);
    }
    
    /**
     * @dev Internal function to remove proposal from active list
     * @param proposalId ID of the proposal to remove
     */
    function _removeFromActiveProposals(uint256 proposalId) internal {
        for (uint256 i = 0; i < activeProposals.length; i++) {
            if (activeProposals[i] == proposalId) {
                activeProposals[i] = activeProposals[activeProposals.length - 1];
                activeProposals.pop();
                break;
            }
        }
    }
}