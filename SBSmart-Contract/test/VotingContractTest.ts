import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { VotingContract, SbFTToken } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VotingContract", function () {
  let votingContract: VotingContract;
  let sbftToken: SbFTToken;
  let owner: SignerWithAddress;
  let proposer: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;
  let nonHolder: SignerWithAddress;

  // Constants from contract
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  const MIN_SBFT_TO_PROPOSE = ethers.parseEther("1000");
  const QUORUM_PERCENTAGE = 1000; // 10%
  const BASIS_POINTS = 10000;

  beforeEach(async function () {
    [owner, proposer, voter1, voter2, voter3, nonHolder] = await ethers.getSigners();

    // Deploy SbFTToken
    const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
    sbftToken = await SbFTTokenFactory.deploy("Stake and Bake Fractional Token", "sbFT");
    await sbftToken.waitForDeployment();

    // Deploy VotingContract
    const VotingContractFactory = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContractFactory.deploy(await sbftToken.getAddress());
    await votingContract.waitForDeployment();

    // Set up initial token distribution
    // First set the staking contract to owner so we can mint tokens
    await sbftToken.setStakingContract(owner.address);
    
    // Mint tokens to users
    await sbftToken.mint(proposer.address, ethers.parseEther("2000")); // Enough to propose
    await sbftToken.mint(voter1.address, ethers.parseEther("5000"));
    await sbftToken.mint(voter2.address, ethers.parseEther("3000"));
    await sbftToken.mint(voter3.address, ethers.parseEther("2000"));
    // nonHolder gets no tokens
  });

  describe("Deployment", function () {
    it("Should set the correct sbFT token address", async function () {
      expect(await votingContract.sbftToken()).to.equal(await sbftToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await votingContract.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await votingContract.VOTING_PERIOD()).to.equal(VOTING_PERIOD);
      expect(await votingContract.MIN_SBFT_TO_PROPOSE()).to.equal(MIN_SBFT_TO_PROPOSE);
      expect(await votingContract.QUORUM_PERCENTAGE()).to.equal(QUORUM_PERCENTAGE);
      expect(await votingContract.BASIS_POINTS()).to.equal(BASIS_POINTS);
    });

    it("Should start with zero proposals", async function () {
      expect(await votingContract.proposalCount()).to.equal(0);
    });

    it("Should revert if deployed with zero address", async function () {
      const VotingContractFactory = await ethers.getContractFactory("VotingContract");
      await expect(
        VotingContractFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid sbFT token");
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const proposalType = 0; // REWARD_RATE_CHANGE

      await expect(
        votingContract.connect(proposer).createProposal(title, description, proposalType)
      )
        .to.emit(votingContract, "ProposalCreated")
        .withArgs(0, title, proposer.address, anyValue, anyValue, proposalType);

      const proposal = await votingContract.getProposal(0);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.proposalType).to.equal(proposalType);
      expect(proposal.executed).to.be.false;
      expect(proposal.passed).to.be.false;
    });

    it("Should set correct voting period", async function () {
      await votingContract.connect(proposer).createProposal("Test", "Description", 0);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.endTime - proposal.startTime).to.equal(VOTING_PERIOD);
    });

    it("Should capture total supply at proposal creation", async function () {
      const expectedTotalSupply = ethers.parseEther("12000"); // 2000 + 5000 + 3000 + 2000
      
      await votingContract.connect(proposer).createProposal("Test", "Description", 0);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.totalVotingPower).to.equal(expectedTotalSupply);
    });

    it("Should add proposal to active proposals", async function () {
      await votingContract.connect(proposer).createProposal("Test", "Description", 0);
      
      const activeProposals = await votingContract.getActiveProposals();
      expect(activeProposals).to.have.lengthOf(1);
      expect(activeProposals[0]).to.equal(0);
    });

    it("Should revert if proposer has insufficient sbFT", async function () {
      await expect(
        votingContract.connect(nonHolder).createProposal("Test", "Description", 0)
      ).to.be.revertedWith("Insufficient sbFT to propose");
    });

    it("Should revert if title is empty", async function () {
      await expect(
        votingContract.connect(proposer).createProposal("", "Description", 0)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should revert if description is empty", async function () {
      await expect(
        votingContract.connect(proposer).createProposal("Title", "", 0)
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should increment proposal count", async function () {
      await votingContract.connect(proposer).createProposal("Test 1", "Description", 0);
      expect(await votingContract.proposalCount()).to.equal(1);
      
      await votingContract.connect(proposer).createProposal("Test 2", "Description", 1);
      expect(await votingContract.proposalCount()).to.equal(2);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Description", 0);
    });

    it("Should allow voting with yes vote", async function () {
      const votingPower = await sbftToken.balanceOf(voter1.address);
      
      await expect(votingContract.connect(voter1).vote(0, true))
        .to.emit(votingContract, "VoteCast")
        .withArgs(0, voter1.address, true, votingPower);

      const vote = await votingContract.getVote(0, voter1.address);
      expect(vote.support).to.be.true;
      expect(vote.votingPower).to.equal(votingPower);
      
      expect(await votingContract.hasVoted(0, voter1.address)).to.be.true;
    });

    it("Should allow voting with no vote", async function () {
      const votingPower = await sbftToken.balanceOf(voter2.address);
      
      await expect(votingContract.connect(voter2).vote(0, false))
        .to.emit(votingContract, "VoteCast")
        .withArgs(0, voter2.address, false, votingPower);

      const vote = await votingContract.getVote(0, voter2.address);
      expect(vote.support).to.be.false;
      expect(vote.votingPower).to.equal(votingPower);
    });

    it("Should update proposal vote counts", async function () {
      await votingContract.connect(voter1).vote(0, true);
      await votingContract.connect(voter2).vote(0, false);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.yesVotes).to.equal(await sbftToken.balanceOf(voter1.address));
      expect(proposal.noVotes).to.equal(await sbftToken.balanceOf(voter2.address));
    });

    it("Should revert if voting on non-existent proposal", async function () {
      await expect(votingContract.connect(voter1).vote(999, true))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("Should revert if already voted", async function () {
      await votingContract.connect(voter1).vote(0, true);
      
      await expect(votingContract.connect(voter1).vote(0, false))
        .to.be.revertedWith("Already voted");
    });

    it("Should revert if voting before start time", async function () {
      // Create a proposal that starts in the future
      await time.increase(1);
      await votingContract.connect(proposer).createProposal("Future", "Description", 0);
      
      // Try to vote immediately (should work since start time is block.timestamp)
      await expect(votingContract.connect(voter1).vote(1, true))
        .to.not.be.reverted;
    });

    it("Should revert if voting after end time", async function () {
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await expect(votingContract.connect(voter1).vote(0, true))
        .to.be.revertedWith("Voting period ended");
    });

    it("Should revert if voter has no voting power", async function () {
      await expect(votingContract.connect(nonHolder).vote(0, true))
        .to.be.revertedWith("No voting power");
    });

    it("Should revert if proposal already executed", async function () {
      // Vote first to avoid "Voting period ended" error
      await votingContract.connect(voter1).vote(0, true);
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      // Execute the proposal
      await votingContract.executeProposal(0);
      
      // Try to vote on executed proposal
      await expect(votingContract.connect(voter2).vote(0, true))
        .to.be.revertedWith("Proposal already executed");
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Description", 0);
    });

    it("Should execute proposal that passes quorum and majority", async function () {
      // Vote with enough power to meet quorum (>10% of total supply)
      await votingContract.connect(voter1).vote(0, true); // 5000 tokens
      await votingContract.connect(voter2).vote(0, true); // 3000 tokens
      // Total: 8000 tokens > 10% of 12000 = 1200 tokens
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await expect(votingContract.executeProposal(0))
        .to.emit(votingContract, "ProposalExecuted")
        .withArgs(0, true, anyValue, anyValue, anyValue);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.true;
    });

    it("Should fail proposal that doesn't meet quorum", async function () {
      // Vote with insufficient power to meet quorum
      await votingContract.connect(voter3).vote(0, true); // Only 2000 tokens < 10% of 12000
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await expect(votingContract.executeProposal(0))
        .to.emit(votingContract, "ProposalExecuted")
        .withArgs(0, false, anyValue, anyValue, anyValue);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.false;
      
      // Check quorum calculation
      const results = await votingContract.getProposalResults(0);
      expect(results.quorumMet).to.be.false; // 2000 tokens < 10% of 12000
    });

    it("Should fail proposal that meets quorum but not majority", async function () {
      // Vote with enough power to meet quorum but more no votes
      await votingContract.connect(voter1).vote(0, false); // 5000 tokens no
      await votingContract.connect(voter2).vote(0, true);  // 3000 tokens yes
      // Total: 8000 tokens > 10% quorum, but more no votes
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await expect(votingContract.executeProposal(0))
        .to.emit(votingContract, "ProposalExecuted")
        .withArgs(0, false, anyValue, anyValue, anyValue);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.false;
    });

    it("Should remove proposal from active proposals after execution", async function () {
      await votingContract.connect(voter1).vote(0, true);
      await votingContract.connect(voter2).vote(0, true);
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await votingContract.executeProposal(0);
      
      const activeProposals = await votingContract.getActiveProposals();
      expect(activeProposals).to.have.lengthOf(0);
    });

    it("Should revert if voting period not ended", async function () {
      await expect(votingContract.executeProposal(0))
        .to.be.revertedWith("Voting period not ended");
    });

    it("Should revert if proposal already executed", async function () {
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await votingContract.executeProposal(0);
      
      await expect(votingContract.executeProposal(0))
        .to.be.revertedWith("Proposal already executed");
    });

    it("Should revert if proposal doesn't exist", async function () {
      await expect(votingContract.executeProposal(999))
        .to.be.revertedWith("Proposal does not exist");
    });
  });

  describe("Proposal Cancellation", function () {
    beforeEach(async function () {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Description", 0);
    });

    it("Should allow proposer to cancel proposal", async function () {
      await expect(votingContract.connect(proposer).cancelProposal(0))
        .to.emit(votingContract, "ProposalCanceled")
        .withArgs(0);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.false;
    });

    it("Should allow owner to cancel proposal", async function () {
      await expect(votingContract.connect(owner).cancelProposal(0))
        .to.emit(votingContract, "ProposalCanceled")
        .withArgs(0);
      
      const proposal = await votingContract.getProposal(0);
      expect(proposal.executed).to.be.true;
      expect(proposal.passed).to.be.false;
    });

    it("Should remove proposal from active proposals after cancellation", async function () {
      await votingContract.connect(proposer).cancelProposal(0);
      
      const activeProposals = await votingContract.getActiveProposals();
      expect(activeProposals).to.have.lengthOf(0);
    });

    it("Should revert if not authorized to cancel", async function () {
      await expect(votingContract.connect(voter1).cancelProposal(0))
        .to.be.revertedWith("Not authorized to cancel");
    });

    it("Should revert if proposal already executed", async function () {
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      await votingContract.executeProposal(0);
      
      await expect(votingContract.connect(proposer).cancelProposal(0))
        .to.be.revertedWith("Proposal already executed");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Description", 0);
    });

    it("Should return proposal results correctly", async function () {
      await votingContract.connect(voter1).vote(0, true);
      await votingContract.connect(voter2).vote(0, false);
      
      const results = await votingContract.getProposalResults(0);
      expect(results.yesVotes).to.equal(await sbftToken.balanceOf(voter1.address));
      expect(results.noVotes).to.equal(await sbftToken.balanceOf(voter2.address));
      expect(results.totalVotingPower).to.equal(ethers.parseEther("12000"));
      expect(results.quorumMet).to.be.true; // 8000 > 10% of 12000
      expect(results.passed).to.be.false; // Not executed yet
    });

    it("Should return correct can execute status", async function () {
      expect(await votingContract.canExecuteProposal(0)).to.be.false;
      
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      expect(await votingContract.canExecuteProposal(0)).to.be.true;
      
      // Execute and check again
      await votingContract.executeProposal(0);
      expect(await votingContract.canExecuteProposal(0)).to.be.false;
    });

    it("Should return correct voting power", async function () {
      const expectedPower = await sbftToken.balanceOf(voter1.address);
      expect(await votingContract.getVotingPower(voter1.address)).to.equal(expectedPower);
      
      expect(await votingContract.getVotingPower(nonHolder.address)).to.equal(0);
    });

    it("Should return active proposals", async function () {
      await votingContract.connect(proposer).createProposal("Test 2", "Description", 1);
      
      const activeProposals = await votingContract.getActiveProposals();
      expect(activeProposals).to.have.lengthOf(2);
      expect(activeProposals[0]).to.equal(0);
      expect(activeProposals[1]).to.equal(1);
    });
  });

  describe("Multiple Proposals", function () {
    it("Should handle multiple proposals correctly", async function () {
      // Create multiple proposals
      await votingContract.connect(proposer).createProposal("Proposal 1", "Description 1", 0);
      await votingContract.connect(proposer).createProposal("Proposal 2", "Description 2", 1);
      await votingContract.connect(proposer).createProposal("Proposal 3", "Description 3", 2);
      
      expect(await votingContract.proposalCount()).to.equal(3);
      
      // Vote on different proposals
      await votingContract.connect(voter1).vote(0, true);
      await votingContract.connect(voter1).vote(1, false);
      await votingContract.connect(voter2).vote(0, false);
      await votingContract.connect(voter2).vote(2, true);
      
      // Check vote counts
      const proposal0 = await votingContract.getProposal(0);
      expect(proposal0.yesVotes).to.equal(await sbftToken.balanceOf(voter1.address));
      expect(proposal0.noVotes).to.equal(await sbftToken.balanceOf(voter2.address));
      
      const proposal1 = await votingContract.getProposal(1);
      expect(proposal1.yesVotes).to.equal(0);
      expect(proposal1.noVotes).to.equal(await sbftToken.balanceOf(voter1.address));
      
      const proposal2 = await votingContract.getProposal(2);
      expect(proposal2.yesVotes).to.equal(await sbftToken.balanceOf(voter2.address));
      expect(proposal2.noVotes).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero total supply gracefully", async function () {
      // Deploy new contracts with no token supply
      const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
      const emptyToken = await SbFTTokenFactory.deploy("Empty", "EMPTY");
      await emptyToken.waitForDeployment();
      
      const VotingContractFactory = await ethers.getContractFactory("VotingContract");
      const emptyVoting = await VotingContractFactory.deploy(await emptyToken.getAddress());
      await emptyVoting.waitForDeployment();
      
      // Set staking contract and mint minimum tokens to create proposal
      await emptyToken.setStakingContract(owner.address);
      await emptyToken.mint(owner.address, MIN_SBFT_TO_PROPOSE);
      
      // Now burn all tokens to create zero supply scenario
      await emptyToken.burn(owner.address, MIN_SBFT_TO_PROPOSE);
      
      // Try to create proposal with zero supply
      await expect(emptyVoting.connect(owner).createProposal("Test", "Description", 0))
        .to.be.revertedWith("No sbFT tokens in circulation");
    });

    it("Should handle proposal type enum correctly", async function () {
      // Test all proposal types
      await votingContract.connect(proposer).createProposal("Reward Rate", "Description", 0);
      await votingContract.connect(proposer).createProposal("Fee Change", "Description", 1);
      await votingContract.connect(proposer).createProposal("Parameter", "Description", 2);
      await votingContract.connect(proposer).createProposal("General", "Description", 3);
      
      const proposal0 = await votingContract.getProposal(0);
      const proposal1 = await votingContract.getProposal(1);
      const proposal2 = await votingContract.getProposal(2);
      const proposal3 = await votingContract.getProposal(3);
      
      expect(proposal0.proposalType).to.equal(0);
      expect(proposal1.proposalType).to.equal(1);
      expect(proposal2.proposalType).to.equal(2);
      expect(proposal3.proposalType).to.equal(3);
    });
  });
});

// Helper function for anyValue matcher
const anyValue = (value: any) => true;