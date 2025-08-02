import { ethers } from "hardhat";

const STAKING_CONTRACT_ADDRESS = "0x9b5ff784A1bd9863Bb5accBE6508Cef544d497eB";
const SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535";

async function main(): Promise<void> {
  console.log("🔍 Debugging sbFT Token Configuration...\n");
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  console.log("Deployer:", deployer.address);
  console.log("Staking Contract:", STAKING_CONTRACT_ADDRESS);
  console.log("sbFT Token:", SBFT_TOKEN_ADDRESS);
  console.log("═".repeat(60));

  // sbFT Token ABI with the required functions
  const sbftAbi = [
    "function stakingContract() view returns (address)",
    "function setStakingContract(address _stakingContract)",
    "function owner() view returns (address)",
    "function mint(address to, uint256 amount)",
    "function burn(address from, uint256 amount)",
    "function balanceOf(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
  ];

  const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, sbftAbi, deployer);

  try {
    console.log("\n📋 CHECKING SBFT TOKEN CONFIGURATION");
    console.log("═".repeat(60));

    // Check owner
    const owner = await sbftToken.owner();
    console.log(`✅ sbFT Owner: ${owner}`);
    console.log(`   Is deployer owner? ${owner.toLowerCase() === deployer.address.toLowerCase()}`);

    // Check current staking contract setting
    let currentStakingContract;
    try {
      currentStakingContract = await sbftToken.stakingContract();
      console.log(`✅ Current staking contract: ${currentStakingContract}`);
      console.log(`   Is correct address? ${currentStakingContract.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()}`);
    } catch (error) {
      console.log("❌ Failed to get staking contract address:", error);
      currentStakingContract = "0x0000000000000000000000000000000000000000";
    }

    // If staking contract is not set correctly, set it
    if (currentStakingContract.toLowerCase() !== STAKING_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("\n🔧 SETTING STAKING CONTRACT ADDRESS");
      console.log("═".repeat(60));
      
      try {
        const tx = await sbftToken.setStakingContract(STAKING_CONTRACT_ADDRESS);
        console.log(`✅ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`);
        
        // Verify it was set
        const newStakingContract = await sbftToken.stakingContract();
        console.log(`✅ New staking contract: ${newStakingContract}`);
        console.log(`   Correctly set? ${newStakingContract.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()}`);
        
      } catch (error) {
        console.log("❌ Failed to set staking contract:", error);
      }
    } else {
      console.log("✅ Staking contract address is correctly set");
    }

    console.log("\n🧪 TESTING MINT FUNCTION");
    console.log("═".repeat(60));
    
    // Test mint function (should work now)
    try {
      const testAmount = ethers.utils.parseUnits("1", 18);
      const tx = await sbftToken.mint(deployer.address, testAmount);
      console.log(`✅ Mint test transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Mint test confirmed in block: ${receipt?.blockNumber}`);
      
      const balance = await sbftToken.balanceOf(deployer.address);
      console.log(`✅ New balance: ${ethers.utils.formatUnits(balance, 18)} sbFT`);
      
    } catch (error) {
      console.log("❌ Mint test failed:", error);
    }

  } catch (error) {
    console.log("❌ Debug script failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });