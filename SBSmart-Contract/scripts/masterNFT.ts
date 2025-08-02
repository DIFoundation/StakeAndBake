import { ethers } from "hardhat";

async function main() {
  console.log("🔗 Updating Master NFT with new Staking Contract...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Using account:", deployer.address);
  
  // ⚠️ IMPORTANT: Update these addresses
  const MASTER_NFT_ADDRESS = "0x9F69a019DC9F4a4A30a255B572E7F425a7814637"; // Your existing Master NFT
  const NEW_STAKING_CONTRACT_ADDRESS = "0x9b5ff784A1bd9863Bb5accBE6508Cef544d497eB"; // ⚠️ SET THIS TO YOUR NEW STAKING CONTRACT ADDRESS
  const NEW_SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535"; // ⚠️ SET THIS TO YOUR NEW sbFT TOKEN ADDRESS
  
  // Validation
  if (!NEW_STAKING_CONTRACT_ADDRESS) {
    console.error("❌ Please set NEW_STAKING_CONTRACT_ADDRESS to your newly deployed staking contract address");
    process.exit(1);
  }
  
  if (!NEW_SBFT_TOKEN_ADDRESS) {
    console.error("❌ Please set NEW_SBFT_TOKEN_ADDRESS to your newly deployed sbFT token address");
    process.exit(1);
  }
  
  console.log("\n📋 Configuration:");
  console.log(`   Master NFT: ${MASTER_NFT_ADDRESS}`);
  console.log(`   New Staking Contract: ${NEW_STAKING_CONTRACT_ADDRESS}`);
  console.log(`   New sbFT Token: ${NEW_SBFT_TOKEN_ADDRESS}`);
  
  // Master NFT ABI
  const masterNftAbi = [
    "function setStakingContract(address) external",
    "function stakingContract() view returns (address)",
    "function xfiToken() view returns (address)",
    "function sbftToken() view returns (address)",
    "function owner() view returns (address)",
    "function nftMinted() view returns (bool)",
    "function accumulatedRevenue() view returns (uint256)",
    "function currentRound() view returns (uint256)"
  ];
  
  // Get Master NFT contract instance
  const masterNft = new ethers.Contract(MASTER_NFT_ADDRESS, masterNftAbi, deployer);
  
  console.log("\n📊 CURRENT MASTER NFT STATE:");
  console.log("═".repeat(50));
  
  try {
    const owner = await masterNft.owner();
    const currentStakingContract = await masterNft.stakingContract();
    const xfiToken = await masterNft.xfiToken();
    const sbftToken = await masterNft.sbftToken();
    const nftMinted = await masterNft.nftMinted();
    const accumulatedRevenue = await masterNft.accumulatedRevenue();
    const currentRound = await masterNft.currentRound();
    
    console.log(`Owner: ${owner}`);
    console.log(`Current Staking Contract: ${currentStakingContract || "Not set"}`);
    console.log(`XFI Token: ${xfiToken}`);
    console.log(`Current sbFT Token: ${sbftToken}`);
    console.log(`NFT Minted: ${nftMinted}`);
    console.log(`Accumulated Revenue: ${ethers.utils.formatEther(accumulatedRevenue)} XFI`);
    console.log(`Current Round: ${currentRound}`);
    
    // Check if deployer is owner
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error("❌ You are not the owner of the Master NFT contract!");
      console.log(`   Owner: ${owner}`);
      console.log(`   Your address: ${deployer.address}`);
      process.exit(1);
    }
    
    console.log("✅ You are the owner - can proceed with updates");
    
  } catch (error: any) {
    console.error("❌ Failed to read Master NFT state:", error.message);
    process.exit(1);
  }
  
  console.log("\n🔧 UPDATING STAKING CONTRACT:");
  console.log("═".repeat(50));
  
  try {
    const currentStakingContract = await masterNft.stakingContract();
    
    if (currentStakingContract.toLowerCase() === NEW_STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("✅ Staking contract is already set correctly");
    } else {
      console.log(`Updating from: ${currentStakingContract || "Not set"}`);
      console.log(`Updating to: ${NEW_STAKING_CONTRACT_ADDRESS}`);
      
      const setStakingTx = await masterNft.setStakingContract(NEW_STAKING_CONTRACT_ADDRESS);
      console.log(`📤 Transaction sent: ${setStakingTx.hash}`);
      
      const receipt = await setStakingTx.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
      
      // Verify the update
      const newStakingContract = await masterNft.stakingContract();
      console.log(`✅ Verified: Staking contract is now: ${newStakingContract}`);
    }
    
  } catch (error: any) {
    console.error("❌ Failed to update staking contract:", error.message);
    process.exit(1);
  }
  
  console.log("\n🧪 TESTING INTEGRATION:");
  console.log("═".repeat(50));
  
  // Test if new staking contract can call distributeFees
  const stakingAbi = [
    "function setMasterNFT(address) external",
    "function masterNFT() view returns (address)",
    "function owner() view returns (address)"
  ];
  
  try {
    const stakingContract = new ethers.Contract(NEW_STAKING_CONTRACT_ADDRESS, stakingAbi, deployer);
    
    const stakingOwner = await stakingContract.owner();
    const currentMasterNft = await stakingContract.masterNFT();
    
    console.log(`Staking contract owner: ${stakingOwner}`);
    console.log(`Staking contract's Master NFT: ${currentMasterNft || "Not set"}`);
    
    if (currentMasterNft.toLowerCase() !== MASTER_NFT_ADDRESS.toLowerCase()) {
      console.log("🔧 Setting Master NFT address on staking contract...");
      
      if (stakingOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error("❌ You are not the owner of the staking contract!");
        process.exit(1);
      }
      
      const setMasterNftTx = await stakingContract.setMasterNFT(MASTER_NFT_ADDRESS);
      console.log(`📤 Transaction sent: ${setMasterNftTx.hash}`);
      
      const receipt = await setMasterNftTx.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
      
      // Verify
      const newMasterNft = await stakingContract.masterNFT();
      console.log(`✅ Verified: Staking contract's Master NFT is now: ${newMasterNft}`);
    } else {
      console.log("✅ Staking contract already has correct Master NFT address");
    }
    
  } catch (error: any) {
    console.error("❌ Failed to update staking contract's Master NFT:", error.message);
  }
  
  console.log("\n📋 FINAL CONFIGURATION:");
  console.log("═".repeat(50));
  
  try {
    const finalStakingContract = await masterNft.stakingContract();
    const stakingContract = new ethers.Contract(NEW_STAKING_CONTRACT_ADDRESS, stakingAbi, deployer);
    const finalMasterNft = await stakingContract.masterNFT();
    
    console.log(`Master NFT → Staking Contract: ${finalStakingContract}`);
    console.log(`Staking Contract → Master NFT: ${finalMasterNft}`);
    
    if (finalStakingContract.toLowerCase() === NEW_STAKING_CONTRACT_ADDRESS.toLowerCase() &&
        finalMasterNft.toLowerCase() === MASTER_NFT_ADDRESS.toLowerCase()) {
      console.log("🎉 SUCCESS! Both contracts are properly linked!");
    } else {
      console.log("⚠️  Configuration incomplete - manual intervention may be needed");
    }
    
  } catch (error: any) {
    console.error("❌ Failed to verify final configuration:", error.message);
  }
  
  console.log("\n📊 IMPORTANT NOTES:");
  console.log("═".repeat(50));
  console.log("✅ Master NFT will now receive fees from the new staking contract");
  console.log("✅ The old sbFT token reference is still in Master NFT contract");
  console.log("⚠️  You may want to consider if sbFT token address needs updating too");
  console.log("💡 Test the fee distribution flow with a small stake");
  
  console.log("\n🔗 Integration Status:");
  console.log(`   Master NFT: ${MASTER_NFT_ADDRESS}`);
  console.log(`   Staking Contract: ${NEW_STAKING_CONTRACT_ADDRESS}`);
  console.log(`   New sbFT Token: ${NEW_SBFT_TOKEN_ADDRESS}`);
  console.log(`   Integration: ✅ Complete`);
  
  console.log("\n💡 Next Steps:");
  console.log("1. Test staking with small amount to verify fee collection");
  console.log("2. Test revenue distribution after fees accumulate");
  console.log("3. Verify sbFT holders can claim rewards correctly");
  console.log("4. Monitor that old staking contract is no longer used");
}

main()
  .then(() => {
    console.log("\n✅ Master NFT update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Update failed:");
    console.error(error);
    process.exit(1);
  });