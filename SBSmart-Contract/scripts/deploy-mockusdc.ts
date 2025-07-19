import { ethers } from "hardhat";
import { MockUSDC } from "../typechain-types/contracts/tokens/MockUSDCToken.sol";

async function main() {
  console.log("🚀 Starting MockUSDC deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // Token configuration
  const TOKEN_NAME = "Mock USDC";
  const TOKEN_SYMBOL = "USDC";
  const DECIMALS = 6;
  const INITIAL_SUPPLY = 1000000; // 1 million USDC
  
  console.log("\n📋 Token Configuration:");
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Decimals: ${DECIMALS}`);
  console.log(`   Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`   Faucet Amount: 1,000 ${TOKEN_SYMBOL}`);
  console.log(`   Faucet Cooldown: 24 hours`);
  
  // Deploy the contract
  console.log("\n⏳ Deploying MockUSDC contract...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  
  const mockUSDC = await MockUSDCFactory.deploy() as MockUSDC;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await mockUSDC.deployed();
  
  const contractAddress = mockUSDC.address;
  console.log(`✅ MockUSDC deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await mockUSDC.name();
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();
  const totalSupply = await mockUSDC.totalSupply();
  const ownerBalance = await mockUSDC.balanceOf(deployer.address);
  const faucetAmount = await mockUSDC.FAUCET_AMOUNT();
  const faucetCooldown = await mockUSDC.FAUCET_COOLDOWN();
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)} ${symbol}`);
  console.log(`   Owner Balance: ${ethers.utils.formatUnits(ownerBalance, decimals)} ${symbol}`);
  console.log(`   Owner Address: ${deployer.address}`);
  console.log(`   Faucet Amount: ${ethers.utils.formatUnits(faucetAmount, decimals)} ${symbol}`);
  console.log(`   Faucet Cooldown: ${(faucetCooldown / 3600)} hours`);
  
  // Test mint function (optional)
  console.log("\n🧪 Testing mint function...");
  const testMintAmount = ethers.utils.parseUnits("5000", decimals); // 5000 USDC
  const mintTx = await mockUSDC.mint(deployer.address, testMintAmount);
  await mintTx.wait();
  
  const newBalance = await mockUSDC.balanceOf(deployer.address);
  console.log(`✅ Minted 5,000 ${symbol}. New balance: ${ethers.utils.formatUnits(newBalance, decimals)} ${symbol}`);
  
  // Test faucet availability check
  console.log("\n🚰 Testing faucet function...");
  const [canUse, timeRemaining] = await mockUSDC.canUseFaucet(deployer.address);
  console.log(`   Can use faucet: ${canUse}`);
  console.log(`   Time remaining: ${timeRemaining} seconds`);
  
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
    totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
    faucetAmount: ethers.utils.formatUnits(faucetAmount, decimals),
    faucetCooldown: `${faucetCooldown / 3600} hours`,
    deploymentTime: new Date().toISOString(),
    transactionHash: mockUSDC.deployTransaction.hash
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Token: ${deploymentInfo.tokenName} (${deploymentInfo.tokenSymbol})`);
  console.log(`Decimals: ${deploymentInfo.decimals}`);
  console.log(`Total Supply: ${deploymentInfo.totalSupply} ${deploymentInfo.tokenSymbol}`);
  console.log(`Faucet Amount: ${deploymentInfo.faucetAmount} ${deploymentInfo.tokenSymbol}`);
  console.log(`Faucet Cooldown: ${deploymentInfo.faucetCooldown}`);
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
  
  const deploymentFile = path.join(deploymentsDir, `mock-usdc-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 MockUSDC deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Test the faucet function for users to get free USDC");
  console.log("3. Test the mint functions for additional token distribution");
  console.log("4. Use this token address in your testing environment");
  
  console.log("\n🛠️  Available Functions:");
  console.log("• faucet(): Users can get 1,000 USDC every 24 hours");
  console.log("• emergencyMint(amount): Anyone can mint up to 10,000 USDC");
  console.log("• mint(to, amount): Owner can mint any amount to any address");
  console.log("• mintBatch(recipients[], amounts[]): Owner can mint to multiple addresses");
  console.log("• canUseFaucet(address): Check if address can use faucet");
  
  return {
    contract: mockUSDC,
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