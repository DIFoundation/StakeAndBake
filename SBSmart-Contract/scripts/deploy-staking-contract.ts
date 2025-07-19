import { ethers } from "hardhat";
import { StakingContract } from "../typechain-types/contracts/core/StakingContract.sol";

async function main() {
  console.log("🚀 Starting StakingContract deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const XFI_TOKEN_ADDRESS = "0xF321b818669d56C8f11b3617429cD987c745B0D2"; // Replace with your XFI token address
  const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206"; // Replace with your sbFT token address
  const MASTER_NFT_ADDRESS = "0x9F69a019DC9F4a4A30a255B572E7F425a7814637"; // Replace with your StakeAndBakeNFT address (optional)
  
  console.log("\n📋 Staking Contract Configuration:");
  console.log(`   XFI Token: ${XFI_TOKEN_ADDRESS}`);
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   Master NFT: ${MASTER_NFT_ADDRESS || "Not set (can be set later)"}`);
  
  // Validation checks
//   if (XFI_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
//     console.error("❌ Please set the XFI_TOKEN_ADDRESS to your deployed XFI token address");
//     process.exit(1);
//   }
  
//   if (SBFT_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
//     console.error("❌ Please set the SBFT_TOKEN_ADDRESS to your deployed sbFT token address");
//     process.exit(1);
//   }
  
  // Deploy the contract
  console.log("\n⏳ Deploying StakingContract...");
  const StakingContractFactory = await ethers.getContractFactory("StakingContract");
  
  const stakingContract = await StakingContractFactory.deploy(
    XFI_TOKEN_ADDRESS,
    SBFT_TOKEN_ADDRESS
  ) as StakingContract;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await stakingContract.deployed();
  
  const contractAddress = stakingContract.address;
  console.log(`✅ StakingContract deployed to: ${contractAddress}`);
  
  // Set Master NFT if provided
  if (MASTER_NFT_ADDRESS && MASTER_NFT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    console.log("\n🔗 Setting Master NFT address...");
    const setMasterNFTTx = await stakingContract.setMasterNFT(MASTER_NFT_ADDRESS);
    await setMasterNFTTx.wait();
    console.log(`✅ Master NFT address set to: ${MASTER_NFT_ADDRESS}`);
  }
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const xfiToken = await stakingContract.xfiToken();
  const sbftToken = await stakingContract.sbftToken();
  const masterNFT = await stakingContract.masterNFT();
  const stakingLockPeriod = await stakingContract.stakingLockPeriod();
  const annualRewardRate = await stakingContract.annualRewardRate();
  const minStake = await stakingContract.minStake();
  const owner = await stakingContract.owner();
  
  console.log("📊 Contract Details:");
  console.log(`   XFI Token: ${xfiToken}`);
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   Master NFT: ${masterNFT}`);
  console.log(`   Lock Period: ${stakingLockPeriod.toString()} seconds (${stakingLockPeriod.toNumber() / 86400} days)`);
  console.log(`   Annual Reward Rate: ${annualRewardRate.toString()} basis points (${annualRewardRate.toNumber() / 100}% APY)`);
  console.log(`   Min Stake: ${ethers.utils.formatEther(minStake)} XFI`);
  console.log(`   Owner: ${owner}`);
  
  // Get contract statistics
  const [totalStaked, totalFeesCollected, currentRewardRate] = await stakingContract.getContractStats();
  console.log(`   Total Staked: ${ethers.utils.formatEther(totalStaked)} XFI`);
  console.log(`   Total Fees Collected: ${ethers.utils.formatEther(totalFeesCollected)} XFI`);
  console.log(`   Current Reward Rate: ${currentRewardRate.toString()} basis points`);
  
  // Test basic functionality (optional)
  console.log("\n🧪 Testing contract functionality...");
  
  // Test canUnstake function with deployer address
  const [canUnstake, timeRemaining] = await stakingContract.canUnstake(deployer.address);
  console.log(`   Can Unstake (deployer): ${canUnstake}`);
  console.log(`   Time Remaining: ${timeRemaining.toString()} seconds`);
  
  // Test getPendingRewards
  const pendingRewards = await stakingContract.getPendingRewards(deployer.address);
  console.log(`   Pending Rewards (deployer): ${ethers.utils.formatEther(pendingRewards)} XFI`);
  
  // Get user stake info
  const userStake = await stakingContract.getUserStake(deployer.address);
  console.log(`   User Stake Amount: ${ethers.utils.formatEther(userStake.stakedAmount)} XFI`);
  console.log(`   User sbFT Balance: ${ethers.utils.formatEther(userStake.sbftBalance)} sbFT`);
  
  console.log("✅ Contract functionality tests completed!");
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    xfiTokenAddress: xfiToken,
    sbftTokenAddress: sbftToken,
    masterNFTAddress: masterNFT,
    stakingLockPeriod: stakingLockPeriod.toString(),
    annualRewardRate: annualRewardRate.toString(),
    minStake: minStake.toString(),
    owner: owner,
    deploymentTime: new Date().toISOString(),
    transactionHash: stakingContract.deployTransaction.hash,
    constants: {
      STAKING_FEE: "100", // 1%
      BASIS_POINTS: "10000",
      MIN_STAKE: "1000000000000000000", // 1 XFI
      MAX_LOCK_PERIOD: "31536000", // 365 days
      MIN_LOCK_PERIOD: "86400", // 1 day
      SECONDS_PER_YEAR: "31536000"
    }
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`XFI Token: ${deploymentInfo.xfiTokenAddress}`);
  console.log(`sbFT Token: ${deploymentInfo.sbftTokenAddress}`);
  console.log(`Master NFT: ${deploymentInfo.masterNFTAddress}`);
  console.log(`Lock Period: ${parseInt(deploymentInfo.stakingLockPeriod) / 86400} days`);
  console.log(`Reward Rate: ${parseInt(deploymentInfo.annualRewardRate) / 100}% APY`);
  console.log(`Min Stake: ${ethers.utils.formatEther(deploymentInfo.minStake)} XFI`);
  console.log(`Owner: ${deploymentInfo.owner}`);
  console.log(`Transaction Hash: ${deploymentInfo.transactionHash}`);
  console.log(`Deployment Time: ${deploymentInfo.deploymentTime}`);
  console.log("================================");
  
  // Save to file for future reference
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `staking-contract-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 StakingContract deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Set the Master NFT address if not done already using setMasterNFT()");
  console.log("3. Ensure the sbFT token contract has the correct minter/burner permissions");
  console.log("4. Test staking functionality with small amounts");
  console.log("5. Configure the Master NFT contract to recognize this staking contract");
  
  console.log("\n🔗 Important Contract Functions:");
  console.log("- stake(uint256): Stake XFI tokens to receive sbFT");
  console.log("- unstake(uint256): Unstake after lock period expires");
  console.log("- claimRewards(): Claim accumulated staking rewards");
  console.log("- compoundRewards(): Compound rewards back into stake");
  console.log("- setMasterNFT(address): Set the Master NFT contract address");
  console.log("- updateRewardRate(uint256): Update the annual reward rate");
  console.log("- setStakingLockPeriod(uint256): Update the lock period");
  console.log("- setMinStake(uint256): Update minimum stake amount");
  
  console.log("\n⚠️  Important Notes:");
  console.log("- Users need to approve XFI tokens before staking");
  console.log("- 1% staking fee is collected and sent to Master NFT");
  console.log("- sbFT tokens are minted 1:1 with net staked amount");
  console.log("- Lock period must pass before unstaking is allowed");
  console.log("- Emergency unstake is available with penalties");
  
  return {
    contract: stakingContract,
    address: contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });