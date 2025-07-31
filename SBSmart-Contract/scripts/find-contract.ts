import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Finding Your Deployed Voting Contract");
  console.log("========================================");
  
  const [signer] = await ethers.getSigners();
  const userAddress = await signer.getAddress();
  
  console.log(`📍 Your Address: ${userAddress}`);
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log("");

  // Check if there are any deployment artifacts
  console.log("1️⃣ Checking deployment artifacts...");
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Check for deployment files
    const deploymentsPath = path.join(__dirname, '../deployments');
    const artifactsPath = path.join(__dirname, '../artifacts');
    
    if (fs.existsSync(deploymentsPath)) {
      console.log("📁 Found deployments folder");
      const networkDirs = fs.readdirSync(deploymentsPath);
      console.log("   Networks found:", networkDirs.join(', '));
    } else {
      console.log("❌ No deployments folder found");
    }
    
    if (fs.existsSync(artifactsPath)) {
      console.log("📁 Found artifacts folder");
    }
    
  } catch (error) {
    console.log("❌ Could not check deployment files");
  }
  
  console.log("");
  console.log("2️⃣ Let's deploy your voting contract to this network!");
  console.log("");
  
  // Check if VotingContract artifact exists
  try {
    const VotingContract = await ethers.getContractFactory("VotingContract");
    console.log("✅ VotingContract artifact found!");
    
    // You need to provide your sbFT token address here
    console.log("❓ To deploy, we need your sbFT token address on crossfi_testnet");
    console.log("");
    console.log("📋 NEXT STEPS:");
    console.log("1. Find your sbFT token address on crossfi_testnet");
    console.log("2. Use the deployment script below");
    console.log("");
    
    // Show deployment script
    console.log("💻 DEPLOYMENT SCRIPT:");
    console.log("====================");
    console.log(`
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Replace with your actual sbFT token address on crossfi_testnet
  const SBFT_TOKEN_ADDRESS = "0xYourSbFTTokenAddressHere";
  
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const voting = await VotingContract.deploy(SBFT_TOKEN_ADDRESS);
  
  await voting.deployed();
  
  console.log("VotingContract deployed to:", voting.address);
  console.log("sbFT Token used:", SBFT_TOKEN_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
    `);
    
  } catch (error) {
    console.log("❌ VotingContract artifact not found!");
    console.log("   Make sure you've compiled your contracts:");
    console.log("   npx hardhat compile");
  }
  
  console.log("");
  console.log("3️⃣ Alternative: Check your transaction history");
  console.log("");
  
  // Check recent transactions from user address
  try {
    const txCount = await ethers.provider.getTransactionCount(userAddress);
    console.log(`📊 Total transactions from your address: ${txCount}`);
    
    if (txCount > 0) {
      console.log("🔍 Checking your recent transactions for contract deployments...");
      
      // Get recent blocks and check for contract creations
      const latestBlock = await ethers.provider.getBlockNumber();
      const blocksToCheck = Math.min(100, latestBlock); // Check last 100 blocks
      
      console.log(`   Checking last ${blocksToCheck} blocks...`);
      
      let foundContracts = [];
      
      for (let i = 0; i < blocksToCheck; i++) {
        try {
          const blockNumber = latestBlock - i;
          const block = await ethers.provider.getBlockWithTransactions(blockNumber);
          
          for (const tx of block.transactions) {
            if (tx.from.toLowerCase() === userAddress.toLowerCase() && tx.to === null) {
              // This is a contract deployment
              const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
              if (receipt.contractAddress) {
                foundContracts.push({
                  address: receipt.contractAddress,
                  txHash: tx.hash,
                  block: blockNumber
                });
              }
            }
          }
        } catch (error) {
          // Skip this block if we can't read it
          continue;
        }
      }
      
      if (foundContracts.length > 0) {
        console.log("🎉 Found contract deployments from your address:");
        foundContracts.forEach((contract, i) => {
          console.log(`   ${i + 1}. Address: ${contract.address}`);
          console.log(`      TX: ${contract.txHash}`);
          console.log(`      Block: ${contract.block}`);
        });
        
        console.log("");
        console.log("🧪 Testing these contracts for voting functions...");
        
        for (const contract of foundContracts) {
          await testIfVotingContract(contract.address);
        }
      } else {
        console.log("❌ No contract deployments found in recent blocks");
      }
    }
    
  } catch (error) {
    console.log("❌ Could not check transaction history:", error.message);
  }
}

async function testIfVotingContract(address: string) {
  console.log(`\n🔬 Testing ${address}...`);
  
  const testFunctions = [
    "function proposalCount() view returns (uint256)",
    "function getVotingPower(address) view returns (uint256)",
    "function MIN_SBFT_TO_PROPOSE() view returns (uint256)"
  ];
  
  let votingFunctionCount = 0;
  
  for (const func of testFunctions) {
    try {
      const [signer] = await ethers.getSigners();
      const contract = new ethers.Contract(address, [func], signer);
      const funcName = func.split(" ")[1].split("(")[0];
      
      const result = await contract[funcName](
        funcName === "getVotingPower" ? signer.address : undefined
      );
      
      console.log(`   ✅ ${funcName}(): ${result.toString()}`);
      votingFunctionCount++;
    } catch (error) {
      console.log(`   ❌ ${func.split(" ")[1].split("(")[0]}(): Failed`);
    }
  }
  
  if (votingFunctionCount >= 2) {
    console.log(`   🎉 THIS LOOKS LIKE YOUR VOTING CONTRACT! ⭐`);
    console.log(`   📝 Use this address in your scripts: ${address}`);
  } else {
    console.log(`   ℹ️  Not a voting contract (${votingFunctionCount}/3 functions work)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});