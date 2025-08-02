import { ethers } from "hardhat";
import { SbFTToken } from "../typechain-types/contracts/tokens/SbFTToken.sol";

async function main() {
  console.log("🚀 Starting sbFT Token deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");

  // Token configuration
  const TOKEN_NAME = "Stake and Bake Fractional Token";
  const TOKEN_SYMBOL = "sbFT";

  console.log("\n📋 Token Configuration:");
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);

  // Deploy the contract
  console.log("\n⏳ Deploying sbFT Token contract...");
  const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
  const sbftToken = await SbFTTokenFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL
  ) as SbFTToken;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await sbftToken.deployed();
  
  const contractAddress = sbftToken.address;
  console.log(`✅ sbFT Token deployed to: ${contractAddress}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await sbftToken.name();
  const symbol = await sbftToken.symbol();
  const decimals = await sbftToken.decimals();
  const totalSupply = await sbftToken.totalSupply();
  const owner = await sbftToken.owner();
  const stakingContract = await sbftToken.stakingContract();

  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Staking Contract: ${stakingContract || "Not set"}`);

  // Test basic functionality
  console.log("\n🧪 Testing contract functionality...");
  
  // Test holder functions
  const isHolder = await sbftToken.isHolder(deployer.address);
  console.log(`   Is deployer a holder: ${isHolder}`);
  
  // Get holders (will return empty array in current implementation)
  const holders = await sbftToken.getHolders();
  console.log(`   Current holders count: ${holders.length}`);

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    tokenName: name,
    tokenSymbol: symbol,
    decimals: decimals.toString(),
    totalSupply: totalSupply.toString(),
    owner: owner,
    stakingContract: stakingContract,
    deploymentTime: new Date().toISOString(),
    transactionHash: sbftToken.deployTransaction.hash
  };

  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Token: ${deploymentInfo.tokenName} (${deploymentInfo.tokenSymbol})`);
  console.log(`Decimals: ${deploymentInfo.decimals}`);
  console.log(`Total Supply: ${ethers.utils.formatEther(deploymentInfo.totalSupply)} ${deploymentInfo.tokenSymbol}`);
  console.log(`Owner: ${deploymentInfo.owner}`);
  console.log(`Staking Contract: ${deploymentInfo.stakingContract || "Not set"}`);
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
  
  const deploymentFile = path.join(deploymentsDir, `sbft-token-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 sbFT Token deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Deploy the StakingContract with this sbFT token address");
  console.log("2. Call setStakingContract() on this token with the new staking contract address");
  console.log("3. Test minting/burning functionality");
  console.log("4. Configure the Master NFT to work with the new staking contract");

  console.log("\n🔗 Important Contract Functions:");
  console.log("- setStakingContract(address): Set the authorized staking contract");
  console.log("- mint(address, uint256): Mint tokens (only staking contract)");
  console.log("- burn(address, uint256): Burn tokens (only staking contract)");
  console.log("- isHolder(address): Check if address holds tokens");
  console.log("- getHolders(): Get all token holders (simplified for hackathon)");

  console.log("\n⚠️  Important Notes:");
  console.log("- Only the designated staking contract can mint/burn tokens");
  console.log("- You must call setStakingContract() after deploying the staking contract");
  console.log("- The token starts with 0 supply - tokens are only created through staking");
  console.log("- This is an ERC20 token that represents shares in the staking pool");

  return {
    contract: sbftToken,
    address: contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then((result) => {
    console.log("\n✅ Script completed successfully!");
    console.log(`📄 sbFT Token Address: ${result.address}`);
    console.log("\n🔄 Next: Deploy StakingContract with this address");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });