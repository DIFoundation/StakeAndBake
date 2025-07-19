import { ethers } from "hardhat";
import { XFIToken } from "../typechain-types/contracts/tokens/XFIToken";

async function main() {
  console.log("🚀 Starting XFIToken deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // Token configuration
  const TOKEN_NAME = "Cross Finance Token";
  const TOKEN_SYMBOL = "XFI";
  const INITIAL_SUPPLY = 1000000; // 1 million tokens
  
  console.log("\n📋 Token Configuration:");
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} tokens`);
  
  // Deploy the contract
  console.log("\n⏳ Deploying XFIToken contract...");
  const XFITokenFactory = await ethers.getContractFactory("XFIToken");
  
  const xfiToken = await XFITokenFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY
  ) as XFIToken;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await xfiToken.deployed();
  
  const contractAddress = xfiToken.address;
  console.log(`✅ XFIToken deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await xfiToken.name();
  const symbol = await xfiToken.symbol();
  const decimals = await xfiToken.decimals();
  const totalSupply = await xfiToken.totalSupply();
  const ownerBalance = await xfiToken.balanceOf(deployer.address);
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Owner Balance: ${ethers.utils.formatEther(ownerBalance)} ${symbol}`);
  console.log(`   Owner Address: ${deployer.address}`);
  
  // Test mint function (optional)
  console.log("\n🧪 Testing mint function...");
  const testMintAmount = ethers.utils.parseEther("1000"); // 1000 tokens
  const mintTx = await xfiToken.mint(deployer.address, testMintAmount);
  await mintTx.wait();
  
  const newBalance = await xfiToken.balanceOf(deployer.address);
  console.log(`✅ Minted 1000 tokens. New balance: ${ethers.utils.formatEther(newBalance)} ${symbol}`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    decimals: decimals,
    initialSupply: ethers.utils.formatEther(totalSupply),
    deploymentTime: new Date().toISOString(),
    transactionHash: xfiToken.deployTransaction.hash
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Token: ${deploymentInfo.tokenName} (${deploymentInfo.tokenSymbol})`);
  console.log(`Total Supply: ${deploymentInfo.initialSupply} ${deploymentInfo.tokenSymbol}`);
  console.log(`Transaction Hash: ${deploymentInfo.transactionHash}`);
  console.log(`Deployment Time: ${deploymentInfo.deploymentTime}`);
  console.log("================================");
  
  // Optional: Save to file for future reference
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `xfi-token-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 XFIToken deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Test the contract functions");
  console.log("3. Use this token address in your Stake and Bake protocol");
  
  return {
    contract: xfiToken,
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