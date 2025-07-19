import { ethers } from "hardhat";
import { StakeAndBakeNFT } from "../typechain-types/contracts/core/StakeAndBakeNFT.sol";
import { SbFTToken } from "../typechain-types/contracts/tokens/sbFTToken.sol";

async function main() {
  console.log("🚀 Starting setStakingContract interaction...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Interacting with contracts using account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // Contract addresses
  const STAKING_CONTRACT_ADDRESS = "0xb59E4c855a8E142e389bB535962622B42955b9BC";
  const STAKEANDBAKE_NFT_ADDRESS = "0x9F69a019DC9F4a4A30a255B572E7F425a7814637";
  const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206";
  
  console.log("\n📋 Contract Configuration:");
  console.log(`   Staking Contract: ${STAKING_CONTRACT_ADDRESS}`);
  console.log(`   StakeAndBake NFT: ${STAKEANDBAKE_NFT_ADDRESS}`);
  console.log(`   SbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  
  // Get contract instances
  console.log("\n⏳ Connecting to contracts...");
  const stakeAndBakeNFT = await ethers.getContractAt("StakeAndBakeNFT", STAKEANDBAKE_NFT_ADDRESS) as StakeAndBakeNFT;
  const sbftToken = await ethers.getContractAt("SbFTToken", SBFT_TOKEN_ADDRESS) as SbFTToken;
  
  console.log("✅ Connected to contracts successfully");
  
  // Check current ownership and staking contract addresses
  console.log("\n🔍 Checking current state...");
  
  try {
    const nftOwner = await stakeAndBakeNFT.owner();
    const sbftOwner = await sbftToken.owner();
    
    console.log(`📊 Current Owners:`);
    console.log(`   StakeAndBake NFT Owner: ${nftOwner}`);
    console.log(`   SbFT Token Owner: ${sbftOwner}`);
    console.log(`   Current Deployer: ${deployer.address}`);
    
    // Check if deployer is owner of both contracts
    if (nftOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error("❌ Deployer is not owner of StakeAndBake NFT contract");
      return;
    }
    
    if (sbftOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error("❌ Deployer is not owner of SbFT Token contract");
      return;
    }
    
    // Check current staking contract addresses
    try {
      const currentNftStaking = await stakeAndBakeNFT.stakingContract();
      console.log(`   Current NFT Staking Contract: ${currentNftStaking}`);
    } catch (error) {
      console.log("   Current NFT Staking Contract: Not set");
    }
    
    try {
      const currentSbftStaking = await sbftToken.stakingContract();
      console.log(`   Current SbFT Staking Contract: ${currentSbftStaking}`);
    } catch (error) {
      console.log("   Current SbFT Staking Contract: Not set");
    }
    
  } catch (error) {
    console.error("❌ Error checking current state:", error);
    return;
  }
  
  // Set staking contract in StakeAndBake NFT
  console.log("\n⏳ Setting staking contract in StakeAndBake NFT...");
  try {
    const nftTx = await stakeAndBakeNFT.setStakingContract(STAKING_CONTRACT_ADDRESS);
    console.log(`   Transaction hash: ${nftTx.hash}`);
    
    console.log("   Waiting for transaction confirmation...");
    const nftReceipt = await nftTx.wait();
    console.log(`✅ StakeAndBake NFT staking contract set successfully! (Block: ${nftReceipt.blockNumber})`);
    
    // Check for event
    const nftEvent = nftReceipt.events?.find(e => e.event === 'StakingContractSet');
    if (nftEvent) {
      console.log(`   Event emitted - Staking Contract: ${nftEvent.args?.stakingContract}`);
    }
    
  } catch (error) {
    console.error("❌ Failed to set staking contract in StakeAndBake NFT:", error);
    return;
  }
  
  // Set staking contract in SbFT Token
  console.log("\n⏳ Setting staking contract in SbFT Token...");
  try {
    const sbftTx = await sbftToken.setStakingContract(STAKING_CONTRACT_ADDRESS);
    console.log(`   Transaction hash: ${sbftTx.hash}`);
    
    console.log("   Waiting for transaction confirmation...");
    const sbftReceipt = await sbftTx.wait();
    console.log(`✅ SbFT Token staking contract set successfully! (Block: ${sbftReceipt.blockNumber})`);
    
    // Check for event
    const sbftEvent = sbftReceipt.events?.find(e => e.event === 'StakingContractSet');
    if (sbftEvent) {
      console.log(`   Event emitted - Staking Contract: ${sbftEvent.args?.stakingContract}`);
    }
    
  } catch (error) {
    console.error("❌ Failed to set staking contract in SbFT Token:", error);
    return;
  }
  
  // Verify the changes
  console.log("\n🔍 Verifying changes...");
  try {
    const newNftStaking = await stakeAndBakeNFT.stakingContract();
    const newSbftStaking = await sbftToken.stakingContract();
    
    console.log("📊 Updated Staking Contract Addresses:");
    console.log(`   StakeAndBake NFT: ${newNftStaking}`);
    console.log(`   SbFT Token: ${newSbftStaking}`);
    
    // Verify they match the intended address
    if (newNftStaking.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("✅ StakeAndBake NFT staking contract set correctly");
    } else {
      console.log("❌ StakeAndBake NFT staking contract mismatch");
    }
    
    if (newSbftStaking.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("✅ SbFT Token staking contract set correctly");
    } else {
      console.log("❌ SbFT Token staking contract mismatch");
    }
    
  } catch (error) {
    console.error("❌ Error verifying changes:", error);
  }
  
  // Get network info for summary
  const network = await ethers.provider.getNetwork();
  
  console.log("\n📋 Operation Summary:");
  console.log("================================");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Staking Contract: ${STAKING_CONTRACT_ADDRESS}`);
  console.log(`StakeAndBake NFT: ${STAKEANDBAKE_NFT_ADDRESS}`);
  console.log(`SbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`Executor: ${deployer.address}`);
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log("================================");
  
  console.log("\n🎉 setStakingContract operation completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Test the staking functionality");
  console.log("2. Verify that only the staking contract can call protected functions");
  console.log("3. Test the full protocol workflow");
  
  return {
    stakingContract: STAKING_CONTRACT_ADDRESS,
    nftContract: STAKEANDBAKE_NFT_ADDRESS,
    sbftContract: SBFT_TOKEN_ADDRESS,
    network: network.name,
    chainId: network.chainId
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Operation failed:");
    console.error(error);
    process.exit(1);
  });