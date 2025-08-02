import { ethers } from "hardhat";
import { StakingContract } from "../typechain-types/contracts/core/StakingContract.sol";
import { SbFTToken } from "../typechain-types/contracts/tokens/sbFTToken.sol/SbFTToken";

async function main() {
  console.log("🚀 Starting StakingContract deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const XFI_TOKEN_ADDRESS = "0xF321b818669d56C8f11b3617429cD987c745B0D2"; // Your XFI token address
  const SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535"; // ⚠️ SET THIS TO YOUR NEW sbFT TOKEN ADDRESS AFTER DEPLOYING IT
  const MASTER_NFT_ADDRESS = "0x9F69a019DC9F4a4A30a255B572E7F425a7814637"; // Your existing Master NFT address
  
  // Validation
  if (!SBFT_TOKEN_ADDRESS) {
    console.error("❌ Please set SBFT_TOKEN_ADDRESS to your newly deployed sbFT token address");
    console.log("💡 Deploy the sbFT token first, then update this script with the address");
    process.exit(1);
  }
  
  console.log("\n📋 Staking Contract Configuration:");
  console.log(`   XFI Token: ${XFI_TOKEN_ADDRESS}`);
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   Master NFT: ${MASTER_NFT_ADDRESS || "Not set (can be set later)"}`);
  
  // Deploy the contract
  console.log("\n⏳ Deploying StakingContract...");
  const StakingContractFactory = await ethers.getContractFactory("StakingContract");
  
  const stakingContract = await StakingContractFactory.deploy(
    XFI_TOKEN_ADDRESS,
    SBFT_TOKEN_ADDRESS
  ) as StakingContract;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await stakingContract.deployed();
  
  const stakingContractAddress = stakingContract.address;
  console.log(`✅ StakingContract deployed to: ${stakingContractAddress}`);
  
  // Set Master NFT if provided
  if (MASTER_NFT_ADDRESS && MASTER_NFT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    console.log("\n🔗 Setting Master NFT address...");
    const setMasterNFTTx = await stakingContract.setMasterNFT(MASTER_NFT_ADDRESS);
    await setMasterNFTTx.wait();
    console.log(`✅ Master NFT address set to: ${MASTER_NFT_ADDRESS}`);
  }
  
  // 🔥 CRITICAL STEP: Set this staking contract as the authorized minter/burner on sbFT token
  console.log("\n🔥 CRITICAL: Setting staking contract authorization on sbFT token...");
  try {
    const sbftToken = new ethers.Contract(
      SBFT_TOKEN_ADDRESS,
      [
        "function setStakingContract(address) external",
        "function stakingContract() view returns (address)",
        "function owner() view returns (address)"
      ],
      deployer
    );
    
    const currentStakingContract = await sbftToken.stakingContract();
    const sbftOwner = await sbftToken.owner();
    
    console.log(`   Current sbFT staking contract: ${currentStakingContract}`);
    console.log(`   sbFT token owner: ${sbftOwner}`);
    console.log(`   Deployer address: ${deployer.address}`);
    
    if (sbftOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error("❌ You are not the owner of the sbFT token contract!");
      console.log("💡 Either:");
      console.log("   1. Deploy a new sbFT token with your address as owner");
      console.log("   2. Ask the current owner to call setStakingContract()");
      process.exit(1);
    }
    
    if (currentStakingContract.toLowerCase() !== stakingContractAddress.toLowerCase()) {
      console.log("🔧 Setting new staking contract address on sbFT token...");
      const setStakingTx = await sbftToken.setStakingContract(stakingContractAddress);
      await setStakingTx.wait();
      console.log(`✅ sbFT token now authorizes staking contract: ${stakingContractAddress}`);
    } else {
      console.log("✅ sbFT token already has correct staking contract set");
    }
    
    // Verify the setting
    const newStakingContract = await sbftToken.stakingContract();
    console.log(`✅ Verified: sbFT staking contract is now: ${newStakingContract}`);
    
  } catch (error: any) {
    console.error("❌ Failed to set staking contract on sbFT token:", error.message);
    console.log("⚠️  You'll need to manually call setStakingContract() on the sbFT token");
  }
  
  // Verify deployment
  console.log("\n🔍 Verifying staking contract deployment...");
  const xfiToken = await stakingContract.xfiToken();
  const sbftToken = await stakingContract.sbftToken();
  const masterNFT = await stakingContract.masterNFT();
  const unstakingDelay = await stakingContract.unstakingDelay();
  const annualRewardRate = await stakingContract.annualRewardRate();
  const minStake = await stakingContract.minStake();
  const owner = await stakingContract.owner();
  const exchangeRate = await stakingContract.getExchangeRate();
  
  console.log("📊 Contract Details:");
  console.log(`   XFI Token: ${xfiToken}`);
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   Master NFT: ${masterNFT}`);
  console.log(`   Unstaking Delay: ${unstakingDelay.toString()} seconds (${unstakingDelay.toNumber() / 86400} days)`);
  console.log(`   Annual Reward Rate: ${annualRewardRate.toString()} basis points (${annualRewardRate.toNumber() / 100}% APY)`);
  console.log(`   Min Stake: ${ethers.utils.formatEther(minStake)} XFI`);
  console.log(`   Current Exchange Rate: ${ethers.utils.formatEther(exchangeRate)} XFI per sbFT`);
  console.log(`   Owner: ${owner}`);
  
  // Get contract statistics
  const [totalStaked, totalFeesCollected, currentRewardRate] = await stakingContract.getContractStats();
  console.log(`   Total XFI in Pool: ${ethers.utils.formatEther(totalStaked)} XFI`);
  console.log(`   Total Fees Collected: ${ethers.utils.formatEther(totalFeesCollected)} XFI`);
  console.log(`   Current Reward Rate: ${currentRewardRate.toString()} basis points`);
  
  // Get additional liquid staking info
  const totalPendingUnstakes = await stakingContract.totalPendingUnstakes();
  const availableXFI = await stakingContract.getAvailableXFI();
  console.log(`   Total Pending Unstakes: ${ethers.utils.formatEther(totalPendingUnstakes)} XFI`);
  console.log(`   Available XFI for Unstaking: ${ethers.utils.formatEther(availableXFI)} XFI`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: stakingContractAddress,
    deployer: deployer.address,
    xfiTokenAddress: xfiToken,
    sbftTokenAddress: sbftToken,
    masterNFTAddress: masterNFT,
    unstakingDelay: unstakingDelay.toString(),
    annualRewardRate: annualRewardRate.toString(),
    minStake: minStake.toString(),
    exchangeRate: exchangeRate.toString(),
    owner: owner,
    deploymentTime: new Date().toISOString(),
    transactionHash: stakingContract.deployTransaction.hash
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Staking Contract: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`XFI Token: ${deploymentInfo.xfiTokenAddress}`);
  console.log(`sbFT Token: ${deploymentInfo.sbftTokenAddress}`);
  console.log(`Master NFT: ${deploymentInfo.masterNFTAddress}`);
  console.log(`Unstaking Delay: ${parseInt(deploymentInfo.unstakingDelay) / 86400} days`);
  console.log(`Reward Rate: ${parseInt(deploymentInfo.annualRewardRate) / 100}% APY`);
  console.log(`Min Stake: ${ethers.utils.formatEther(deploymentInfo.minStake)} XFI`);
  console.log(`Exchange Rate: ${ethers.utils.formatEther(deploymentInfo.exchangeRate)} XFI per sbFT`);
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
  console.log("1. Test staking with small amounts");
  console.log("2. Test the unstaking request/process flow");
  console.log("3. Verify the exchange rate is working correctly");
  console.log("4. Configure the Master NFT to recognize this staking contract");
  
  console.log("\n✅ READY TO USE!");
  console.log("Your fresh staking system is now deployed and configured:");
  console.log(`   🏦 Staking Contract: ${stakingContractAddress}`);
  console.log(`   🪙 sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   💰 XFI Token: ${XFI_TOKEN_ADDRESS}`);
  console.log(`   🎨 Master NFT: ${MASTER_NFT_ADDRESS}`);
  
  return {
    contract: stakingContract,
    address: stakingContractAddress,
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