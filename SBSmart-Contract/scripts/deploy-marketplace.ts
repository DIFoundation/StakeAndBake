import { ethers } from "hardhat";
import { SbFTMarketplace } from "../typechain-types/contracts/marletplace/sbFTMarketplace.sol";

async function main() {
  console.log("🚀 Starting SbFTMarketplace deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535"; // Replace with your sbFT token address
  const USDC_TOKEN_ADDRESS = "0xdEFAA5459ba8DcC24A7470DB4835C97B0fdf85fc"; // Replace with your USDC token address
  
  console.log("\n📋 Marketplace Contract Configuration:");
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   USDC Token: ${USDC_TOKEN_ADDRESS}`);
  
  // Validation checks
//   if (SBFT_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
//     console.error("❌ Please set the SBFT_TOKEN_ADDRESS to your deployed sbFT token address");
//     process.exit(1);
//   }
  
//   if (USDC_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
//     console.error("❌ Please set the USDC_TOKEN_ADDRESS to your deployed USDC token address");
//     process.exit(1);
//   }
  
  // Deploy the contract
  console.log("\n⏳ Deploying SbFTMarketplace...");
  const SbFTMarketplaceFactory = await ethers.getContractFactory("SbFTMarketplace");
  
  const marketplace = await SbFTMarketplaceFactory.deploy(
    SBFT_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS
  ) as SbFTMarketplace;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await marketplace.deployed();
  
  const contractAddress = marketplace.address;
  console.log(`✅ SbFTMarketplace deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const sbftToken = await marketplace.sbftToken();
  const usdcToken = await marketplace.usdcToken();
  const tradingFee = await marketplace.tradingFee();
  const basisPoints = await marketplace.BASIS_POINTS();
  const minOrderSize = await marketplace.MIN_ORDER_SIZE();
  const orderCount = await marketplace.orderCount();
  const owner = await marketplace.owner();
  
  console.log("📊 Contract Details:");
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   USDC Token: ${usdcToken}`);
  console.log(`   Trading Fee: ${tradingFee.toString()} basis points (${tradingFee.toNumber() / 100}%)`);
  console.log(`   Basis Points: ${basisPoints.toString()}`);
  console.log(`   Min Order Size: ${ethers.utils.formatEther(minOrderSize)} sbFT`);
  console.log(`   Order Count: ${orderCount.toString()}`);
  console.log(`   Owner: ${owner}`);
  
  // Get market statistics
  const [totalVolume, totalTrades, feesCollected] = await marketplace.getMarketStats();
  console.log(`   Total Volume: ${ethers.utils.formatUnits(totalVolume, 6)} USDC`);
  console.log(`   Total Trades: ${totalTrades.toString()}`);
  console.log(`   Fees Collected: ${ethers.utils.formatUnits(feesCollected, 6)} USDC`);
  
  // Test basic functionality (optional)
  console.log("\n🧪 Testing contract functionality...");
  
  // Test getting active orders (should be empty initially)
  const activeBuyOrders = await marketplace.getActiveBuyOrders();
  const activeSellOrders = await marketplace.getActiveSellOrders();
  console.log(`   Active Buy Orders: ${activeBuyOrders.length}`);
  console.log(`   Active Sell Orders: ${activeSellOrders.length}`);
  
  // Test getting user orders (should be empty for deployer)
  const userOrders = await marketplace.getUserOrders(deployer.address);
  console.log(`   User Orders (deployer): ${userOrders.length}`);
  
  console.log("✅ Contract functionality tests completed!");
  
  // Test token contracts connectivity (optional)
  console.log("\n🔗 Testing token contract connectivity...");
  try {
    const sbftContract = await ethers.getContractAt("IERC20", sbftToken);
    const usdcContract = await ethers.getContractAt("IERC20", usdcToken);
    
    // Check if we can read basic token info
    const sbftDecimals = await sbftContract.decimals();
    const usdcDecimals = await usdcContract.decimals();
    
    console.log(`   sbFT Token Decimals: ${sbftDecimals}`);
    console.log(`   USDC Token Decimals: ${usdcDecimals}`);
    
    // Check deployer's token balances
    const deployerSbftBalance = await sbftContract.balanceOf(deployer.address);
    const deployerUsdcBalance = await usdcContract.balanceOf(deployer.address);
    
    console.log(`   Deployer sbFT Balance: ${ethers.utils.formatEther(deployerSbftBalance)} sbFT`);
    console.log(`   Deployer USDC Balance: ${ethers.utils.formatUnits(deployerUsdcBalance, usdcDecimals)} USDC`);
    
  } catch (error) {
    console.log(`   ⚠️  Could not verify token contracts: ${error.message}`);
  }
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    sbftTokenAddress: sbftToken,
    usdcTokenAddress: usdcToken,
    tradingFee: tradingFee.toString(),
    basisPoints: basisPoints.toString(),
    minOrderSize: minOrderSize.toString(),
    owner: owner,
    deploymentTime: new Date().toISOString(),
    transactionHash: marketplace.deployTransaction.hash,
    constants: {
      TRADING_FEE: "250", // 2.5%
      BASIS_POINTS: "10000",
      MIN_ORDER_SIZE: "1000000000000000000", // 1 sbFT
      USDC_DECIMALS: "6",
      SBFT_DECIMALS: "18"
    }
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`sbFT Token: ${deploymentInfo.sbftTokenAddress}`);
  console.log(`USDC Token: ${deploymentInfo.usdcTokenAddress}`);
  console.log(`Trading Fee: ${parseInt(deploymentInfo.tradingFee) / 100}%`);
  console.log(`Min Order Size: ${ethers.utils.formatEther(deploymentInfo.minOrderSize)} sbFT`);
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
  
  const deploymentFile = path.join(deploymentsDir, `sbft-marketplace-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 SbFTMarketplace deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Ensure users have approved the marketplace to spend their tokens");
  console.log("3. Test order creation with small amounts");
  console.log("4. Monitor trading activity and fee collection");
  console.log("5. Consider setting up subgraph indexing for better order tracking");
  
  console.log("\n🔗 Important Contract Functions:");
  console.log("- createBuyOrder(uint256, uint256): Create a buy order for sbFT tokens");
  console.log("- createSellOrder(uint256, uint256): Create a sell order for sbFT tokens");
  console.log("- cancelOrder(uint256): Cancel an active order");
  console.log("- getActiveBuyOrders(): Get all active buy orders");
  console.log("- getActiveSellOrders(): Get all active sell orders");
  console.log("- getUserOrders(address): Get orders for a specific user");
  console.log("- getOrder(uint256): Get details of a specific order");
  console.log("- getMarketStats(): Get trading statistics");
  console.log("- updateTradingFee(uint256): Update trading fee (owner only)");
  console.log("- withdrawFees(address): Withdraw collected fees (owner only)");
  
  console.log("\n⚠️  Important Notes:");
  console.log("- Users need to approve tokens before creating orders:");
  console.log("  - sbFT approval for sell orders");
  console.log("  - USDC approval for buy orders");
  console.log("- Prices are specified in USDC per sbFT (scaled by 1e6 for USDC)");
  console.log("- Orders are automatically matched when created");
  console.log("- Trading fee is 2.5% by default (can be updated by owner)");
  console.log("- Minimum order size is 1 sbFT");
  console.log("- Orders can be partially filled");
  console.log("- Funds are held in escrow until orders are filled or canceled");
  
  console.log("\n📖 Usage Examples:");
  console.log("- Create buy order: createBuyOrder(ethers.utils.parseEther('100'), ethers.utils.parseUnits('1.5', 6))");
  console.log("  → Buy 100 sbFT at 1.5 USDC per sbFT");
  console.log("- Create sell order: createSellOrder(ethers.utils.parseEther('50'), ethers.utils.parseUnits('2.0', 6))");
  console.log("  → Sell 50 sbFT at 2.0 USDC per sbFT");
  
  return {
    contract: marketplace,
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