import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
  StakeAndBakeNFT, 
  XFIToken, 
  SbFTToken,
  StakingContract 
} from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("StakeAndBakeNFT", function () {
  let stakeAndBakeNFT: StakeAndBakeNFT;
  let xfiToken: XFIToken;
  let sbftToken: SbFTToken;
  let stakingContract: StakingContract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const STAKE_AMOUNT = ethers.parseEther("1000");
  const DISTRIBUTION_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy XFI Token
    const XFITokenFactory = await ethers.getContractFactory("XFIToken");
    xfiToken = await XFITokenFactory.deploy("CrossFi Token", "XFI", INITIAL_SUPPLY);

    // Deploy sbFT Token
    const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
    sbftToken = await SbFTTokenFactory.deploy("Stake and Bake Fractional Token", "sbFT");

    // Deploy StakeAndBakeNFT
    const StakeAndBakeNFTFactory = await ethers.getContractFactory("StakeAndBakeNFT");
    stakeAndBakeNFT = await StakeAndBakeNFTFactory.deploy(
      "Stake and Bake Master NFT",
      "SBNFT",
      await xfiToken.getAddress(),
      await sbftToken.getAddress(),
      "https://example.com/nft/metadata.json"
    );

    // Deploy Staking Contract
    const StakingContractFactory = await ethers.getContractFactory("StakingContract");
    stakingContract = await StakingContractFactory.deploy(
      await xfiToken.getAddress(),
      await sbftToken.getAddress()
    );

    // Set up permissions - Update sbFT token to use staking contract
    await sbftToken.setStakingContract(await stakingContract.getAddress());

    // Connect contracts
    await stakeAndBakeNFT.setStakingContract(await stakingContract.getAddress());
    await stakingContract.setMasterNFT(await stakeAndBakeNFT.getAddress());

    // Transfer tokens to users
    await xfiToken.transfer(user1.address, ethers.parseEther("10000"));
    await xfiToken.transfer(user2.address, ethers.parseEther("10000"));
    await xfiToken.transfer(user3.address, ethers.parseEther("10000"));

    // Transfer some XFI to StakeAndBakeNFT for revenue distribution
    await xfiToken.transfer(await stakeAndBakeNFT.getAddress(), ethers.parseEther("5000"));
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      expect(await stakeAndBakeNFT.name()).to.equal("Stake and Bake Master NFT");
      expect(await stakeAndBakeNFT.symbol()).to.equal("SBNFT");
      expect(await stakeAndBakeNFT.xfiToken()).to.equal(await xfiToken.getAddress());
      expect(await stakeAndBakeNFT.sbftToken()).to.equal(await sbftToken.getAddress());
      expect(await stakeAndBakeNFT.DISTRIBUTION_PERIOD()).to.equal(DISTRIBUTION_PERIOD);
    });

    it("Should initialize with correct state", async function () {
      expect(await stakeAndBakeNFT.nftMinted()).to.be.false;
      expect(await stakeAndBakeNFT.currentRound()).to.equal(0);
      expect(await stakeAndBakeNFT.accumulatedRevenue()).to.equal(0);
    });

    it("Should revert with zero addresses", async function () {
      const StakeAndBakeNFTFactory = await ethers.getContractFactory("StakeAndBakeNFT");
      
      await expect(
        StakeAndBakeNFTFactory.deploy(
          "Test",
          "TEST",
          ethers.ZeroAddress,
          await sbftToken.getAddress(),
          "uri"
        )
      ).to.be.revertedWith("Invalid XFI token");

      await expect(
        StakeAndBakeNFTFactory.deploy(
          "Test",
          "TEST",
          await xfiToken.getAddress(),
          ethers.ZeroAddress,
          "uri"
        )
      ).to.be.revertedWith("Invalid sbFT token");
    });
  });

  describe("Staking Contract Management", function () {
    it("Should set staking contract", async function () {
      const newStakingContract = await ethers.getContractFactory("StakingContract");
      const newStaking = await newStakingContract.deploy(
        await xfiToken.getAddress(),
        await sbftToken.getAddress()
      );

      await expect(stakeAndBakeNFT.setStakingContract(await newStaking.getAddress()))
        .to.emit(stakeAndBakeNFT, "StakingContractSet")
        .withArgs(await newStaking.getAddress());

      expect(await stakeAndBakeNFT.stakingContract()).to.equal(await newStaking.getAddress());
    });

    it("Should revert setting zero address as staking contract", async function () {
      await expect(
        stakeAndBakeNFT.setStakingContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid staking contract");
    });

    it("Should revert when non-owner tries to set staking contract", async function () {
      await expect(
        stakeAndBakeNFT.connect(user1).setStakingContract(user1.address)
      ).to.be.revertedWithCustomError(stakeAndBakeNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Master NFT Minting", function () {
    it("Should mint master NFT", async function () {
      await expect(stakeAndBakeNFT.mintMasterNFT(user1.address))
        .to.emit(stakeAndBakeNFT, "MasterNFTMinted")
        .withArgs(user1.address, 1);

      expect(await stakeAndBakeNFT.ownerOf(1)).to.equal(user1.address);
      expect(await stakeAndBakeNFT.nftMinted()).to.be.true;
    });

    it("Should revert minting to zero address", async function () {
      await expect(
        stakeAndBakeNFT.mintMasterNFT(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should revert minting master NFT twice", async function () {
      await stakeAndBakeNFT.mintMasterNFT(user1.address);
      
      await expect(
        stakeAndBakeNFT.mintMasterNFT(user2.address)
      ).to.be.revertedWith("Master NFT already minted");
    });

    it("Should revert when non-owner tries to mint", async function () {
      await expect(
        stakeAndBakeNFT.connect(user1).mintMasterNFT(user1.address)
      ).to.be.revertedWithCustomError(stakeAndBakeNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Revenue Distribution", function () {
    beforeEach(async function () {
      // Setup users with stakes
      await xfiToken.connect(user1).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await xfiToken.connect(user2).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      
      await stakingContract.connect(user1).stake(STAKE_AMOUNT);
      await stakingContract.connect(user2).stake(STAKE_AMOUNT);
    });

    it("Should receive fees automatically when staking", async function () {
      const initialAccumulatedRevenue = await stakeAndBakeNFT.accumulatedRevenue();
      
      // The fee is automatically sent to the NFT contract when staking
      // With 1% fee on 1000 XFI, we expect 10 XFI fee * 2 users = 20 XFI
      const expectedFees = ethers.parseEther("20"); // 1% of 2000 XFI staked
      
      expect(initialAccumulatedRevenue).to.equal(expectedFees);
    });

    it("Should distribute revenue after period", async function () {
      const accumulatedRevenue = await stakeAndBakeNFT.accumulatedRevenue();
      
      // Fast forward time
      await time.increase(DISTRIBUTION_PERIOD + 1);

      const totalSbftSupply = await sbftToken.totalSupply();
      const expectedRevenuePerToken = (accumulatedRevenue * ethers.parseEther("1")) / totalSbftSupply;

      await expect(stakeAndBakeNFT.distributeRevenue())
        .to.emit(stakeAndBakeNFT, "RevenueDistributed")
        .withArgs(1, accumulatedRevenue, totalSbftSupply);

      const round = await stakeAndBakeNFT.getDistributionRound(1);
      expect(round.totalRevenue).to.equal(accumulatedRevenue);
      expect(round.totalSbftSupply).to.equal(totalSbftSupply);
      expect(round.revenuePerToken).to.equal(expectedRevenuePerToken);
      expect(await stakeAndBakeNFT.currentRound()).to.equal(1);
      expect(await stakeAndBakeNFT.accumulatedRevenue()).to.equal(0);
    });

    it("Should revert distribution before period", async function () {
      await expect(
        stakeAndBakeNFT.distributeRevenue()
      ).to.be.revertedWith("Distribution period not reached");
    });

    it("Should revert distribution with no revenue", async function () {
      // First we need to distribute current revenue
      await time.increase(DISTRIBUTION_PERIOD + 1);
      await stakeAndBakeNFT.distributeRevenue();
      
      // Now try to distribute again with no new revenue
      await time.increase(DISTRIBUTION_PERIOD + 1);
      await expect(
        stakeAndBakeNFT.distributeRevenue()
      ).to.be.revertedWith("No revenue to distribute");
    });

    it("Should revert distribution with no sbFT supply", async function () {
      // First unstake all tokens
      const user1Stake = await stakingContract.getUserStake(user1.address);
      const user2Stake = await stakingContract.getUserStake(user2.address);
      
      await stakingContract.connect(user1).unstake(user1Stake.sbftBalance);
      await stakingContract.connect(user2).unstake(user2Stake.sbftBalance);

      await time.increase(DISTRIBUTION_PERIOD + 1);

      await expect(
        stakeAndBakeNFT.distributeRevenue()
      ).to.be.revertedWith("No sbFT tokens in circulation");
    });
  });

  describe("Rewards Claiming", function () {
    beforeEach(async function () {
      // Setup users with stakes
      await xfiToken.connect(user1).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await xfiToken.connect(user2).approve(await stakingContract.getAddress(), STAKE_AMOUNT * 2n);
      
      await stakingContract.connect(user1).stake(STAKE_AMOUNT);
      await stakingContract.connect(user2).stake(STAKE_AMOUNT * 2n); // user2 has 2x stake

      // Wait for distribution period and distribute
      await time.increase(DISTRIBUTION_PERIOD + 1);
      await stakeAndBakeNFT.distributeRevenue();
    });

    it("Should claim rewards for single round", async function () {
      const pendingRewards = await stakeAndBakeNFT.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.gt(0);

      await expect(stakeAndBakeNFT.connect(user1).claimRewards([1]))
        .to.emit(stakeAndBakeNFT, "RewardsClaimed")
        .withArgs(user1.address, pendingRewards, 1);

      expect(await stakeAndBakeNFT.lastClaimedRound(user1.address)).to.equal(1);
      expect(await stakeAndBakeNFT.getPendingRewards(user1.address)).to.equal(0);
    });

    it("Should claim rewards for multiple rounds", async function () {
      // Create second round by staking more (generates more fees)
      await xfiToken.connect(user3).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await stakingContract.connect(user3).stake(STAKE_AMOUNT);
      
      await time.increase(DISTRIBUTION_PERIOD + 1);
      await stakeAndBakeNFT.distributeRevenue();

      const pendingRewards = await stakeAndBakeNFT.getPendingRewards(user1.address);
      
      await expect(stakeAndBakeNFT.connect(user1).claimRewards([1, 2]))
        .to.emit(stakeAndBakeNFT, "RewardsClaimed");

      expect(await stakeAndBakeNFT.lastClaimedRound(user1.address)).to.equal(2);
    });

    it("Should revert claiming non-existent round", async function () {
      await expect(
        stakeAndBakeNFT.connect(user1).claimRewards([999])
      ).to.be.revertedWith("Round does not exist");
    });

    it("Should revert claiming already claimed round", async function () {
      await stakeAndBakeNFT.connect(user1).claimRewards([1]);
      
      await expect(
        stakeAndBakeNFT.connect(user1).claimRewards([1])
      ).to.be.revertedWith("Round already claimed");
    });

    it("Should revert claiming with no rewards", async function () {
      await expect(
        stakeAndBakeNFT.connect(user3).claimRewards([1])
      ).to.be.revertedWith("No rewards to claim");
    });

    it("Should calculate rewards proportionally", async function () {
      const user1Rewards = await stakeAndBakeNFT.getPendingRewards(user1.address);
      const user2Rewards = await stakeAndBakeNFT.getPendingRewards(user2.address);

      // user2 should have 2x rewards since they staked 2x amount
      // Allow for some precision error
      const ratio = user2Rewards * 1000n / user1Rewards;
      expect(ratio).to.be.closeTo(2000n, 100n); // Should be close to 2.0
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Setup basic scenario
      await xfiToken.connect(user1).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await stakingContract.connect(user1).stake(STAKE_AMOUNT);

      await time.increase(DISTRIBUTION_PERIOD + 1);
      await stakeAndBakeNFT.distributeRevenue();
    });

    it("Should get pending rewards", async function () {
      const pendingRewards = await stakeAndBakeNFT.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.gt(0);

      // After claiming, should be 0
      await stakeAndBakeNFT.connect(user1).claimRewards([1]);
      expect(await stakeAndBakeNFT.getPendingRewards(user1.address)).to.equal(0);
    });

    it("Should get claimable rounds", async function () {
      let claimableRounds = await stakeAndBakeNFT.getClaimableRounds(user1.address);
      expect(claimableRounds).to.deep.equal([1n]);

      // After claiming, should be empty
      await stakeAndBakeNFT.connect(user1).claimRewards([1]);
      claimableRounds = await stakeAndBakeNFT.getClaimableRounds(user1.address);
      expect(claimableRounds).to.deep.equal([]);
    });

    it("Should get distribution round info", async function () {
      const round = await stakeAndBakeNFT.getDistributionRound(1);
      expect(round.totalRevenue).to.equal(ethers.parseEther("10")); // 1% of 1000 XFI
      expect(round.totalSbftSupply).to.be.gt(0);
      expect(round.revenuePerToken).to.be.gt(0);
    });

    it("Should check if distribution is due", async function () {
      expect(await stakeAndBakeNFT.isDistributionDue()).to.be.false;

      // Add more revenue by staking
      await xfiToken.connect(user2).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await stakingContract.connect(user2).stake(STAKE_AMOUNT);

      await time.increase(DISTRIBUTION_PERIOD + 1);
      expect(await stakeAndBakeNFT.isDistributionDue()).to.be.true;
    });

    it("Should get time until next distribution", async function () {
      const timeUntilNext = await stakeAndBakeNFT.getTimeUntilNextDistribution();
      expect(timeUntilNext).to.be.lte(DISTRIBUTION_PERIOD);

      await time.increase(DISTRIBUTION_PERIOD + 1);
      expect(await stakeAndBakeNFT.getTimeUntilNextDistribution()).to.equal(0);
    });
  });

  describe("NFT Metadata", function () {
    it("Should return correct token URI", async function () {
      await stakeAndBakeNFT.mintMasterNFT(user1.address);
      
      expect(await stakeAndBakeNFT.tokenURI(1)).to.equal("https://example.com/nft/metadata.json");
    });

    it("Should revert token URI for non-existent token", async function () {
      await expect(
        stakeAndBakeNFT.tokenURI(1)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should update token URI", async function () {
      const newURI = "https://newuri.com/metadata.json";
      await stakeAndBakeNFT.setTokenURI(newURI);
      
      await stakeAndBakeNFT.mintMasterNFT(user1.address);
      expect(await stakeAndBakeNFT.tokenURI(1)).to.equal(newURI);
    });

    it("Should revert token URI update from non-owner", async function () {
      await expect(
        stakeAndBakeNFT.connect(user1).setTokenURI("new-uri")
      ).to.be.revertedWithCustomError(stakeAndBakeNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should emergency withdraw", async function () {
      const contractBalance = await xfiToken.balanceOf(await stakeAndBakeNFT.getAddress());
      const ownerBalanceBefore = await xfiToken.balanceOf(owner.address);

      await stakeAndBakeNFT.emergencyWithdraw();

      const ownerBalanceAfter = await xfiToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance);
      expect(await xfiToken.balanceOf(await stakeAndBakeNFT.getAddress())).to.equal(0);
    });

    it("Should revert emergency withdraw from non-owner", async function () {
      await expect(
        stakeAndBakeNFT.connect(user1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(stakeAndBakeNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration with Staking Contract", function () {
    it("Should handle complete stake-distribute-claim cycle", async function () {
      // User stakes
      await xfiToken.connect(user1).approve(await stakingContract.getAddress(), STAKE_AMOUNT);
      await stakingContract.connect(user1).stake(STAKE_AMOUNT);

      // Check that fees were sent to NFT contract
      const accumulatedRevenue = await stakeAndBakeNFT.accumulatedRevenue();
      expect(accumulatedRevenue).to.be.gt(0);

      // Wait for distribution period
      await time.increase(DISTRIBUTION_PERIOD + 1);

      // Distribute revenue
      await stakeAndBakeNFT.distributeRevenue();

      // Check pending rewards
      const pendingRewards = await stakeAndBakeNFT.getPendingRewards(user1.address);
      expect(pendingRewards).to.be.gt(0);

      // Claim rewards
      const userBalanceBefore = await xfiToken.balanceOf(user1.address);
      await stakeAndBakeNFT.connect(user1).claimRewards([1]);
      const userBalanceAfter = await xfiToken.balanceOf(user1.address);

      expect(userBalanceAfter).to.equal(userBalanceBefore + pendingRewards);
    });
  });
});