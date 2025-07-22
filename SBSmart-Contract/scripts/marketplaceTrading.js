import { ethers } from "hardhat";

async function main() {
  console.log("🚀 SbFTMarketplace Setup and Trading Script");
  console.log("==========================================\n");
  
  // Contract addresses
  const MARKETPLACE_ADDRESS = "0x9c07F3E090c5E21295C6111dAD966d057220D36e";
  const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206";
  const USDC_TOKEN_ADDRESS = "0xdEFAA5459ba8DcC24A7470DB4835C97B0fdf85fc";
  
  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👥 Available accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   User1: ${user1.address}`);
  console.log(`   User2: ${user2.address}\n`);
  
  // Get contract instances
  const marketplace = await ethers.getContractAt("SbFTMarketplace", MARKETPLACE_ADDRESS);
  const sbftToken = await ethers.getContractAt("IERC20", SBFT_TOKEN_ADDRESS);
  const usdcToken = await ethers.getContractAt("IERC20", USDC_TOKEN_ADDRESS);
  
  console.log("📋 Contract instances created successfully\n");
  
  // Check initial balances
  console.log("💰 Initial Token Balances:");
  await checkBalances([deployer, user1, user2], sbftToken, usdcToken);
  
  // Check current allowances
  console.log("🔒 Current Allowances:");
  await checkAllowances([deployer, user1, user2], sbftToken, usdcToken, MARKETPLACE_ADDRESS);
  
  // Setup approvals
  console.log("📝 Setting up token approvals...");
  await setupApprovals([deployer, user1, user2], sbftToken, usdcToken, MARKETPLACE_ADDRESS);
  
  // Check allowances after approval
  console.log("✅ Updated Allowances:");
  await checkAllowances([deployer, user1, user2], sbftToken, usdcToken, MARKETPLACE_ADDRESS);
  
  // Demo: Create sample orders
  console.log("📊 Creating sample orders...");
  await createSampleOrders(marketplace, deployer, user1, user2);
  
  // Show market status
  console.log("📈 Market Status:");
  await showMarketStatus(marketplace);
  
  console.log("\n🎉 Setup completed successfully!");
  console.log("\n💡 Next Steps:");
  console.log("1. Users can now create buy/sell orders");
  console.log("2. Orders will be automatically matched when prices align");
  console.log("3. Monitor trading activity through events");
  console.log("4. Owner can withdraw fees and update parameters");
}

async function checkBalances(users, sbftToken, usdcToken) {
  for (const user of users) {
    const sbftBalance = await sbftToken.balanceOf(user.address);
    const usdcBalance = await usdcToken.balanceOf(user.address);
    
    console.log(`   ${user.address}:`);
    console.log(`     sbFT: ${ethers.utils.formatEther(sbftBalance)}`);
    console.log(`     USDC: ${ethers.utils.formatUnits(usdcBalance, 6)}`);
  }
  console.log();
}

async function checkAllowances(users, sbftToken, usdcToken, spenderAddress) {
  for (const user of users) {
    const sbftAllowance = await sbftToken.allowance(user.address, spenderAddress);
    const usdcAllowance = await usdcToken.allowance(user.address, spenderAddress);
    
    console.log(`   ${user.address}:`);
    console.log(`     sbFT allowance: ${ethers.utils.formatEther(sbftAllowance)}`);
    console.log(`     USDC allowance: ${ethers.utils.formatUnits(usdcAllowance, 6)}`);
  }
  console.log();
}

async function setupApprovals(users, sbftToken, usdcToken, spenderAddress) {
  const maxApproval = ethers.constants.MaxUint256;
  
  for (const user of users) {
    try {
      // Check current balances to determine if approval is needed
      const sbftBalance = await sbftToken.balanceOf(user.address);
      const usdcBalance = await usdcToken.balanceOf(user.address);
      
      if (sbftBalance.gt(0)) {
        console.log(`   Approving sbFT for ${user.address}...`);
        const sbftApproveTx = await sbftToken.connect(user).approve(spenderAddress, maxApproval);
        await sbftApproveTx.wait();
        console.log(`     ✅ sbFT approved`);
      }
      
      if (usdcBalance.gt(0)) {
        console.log(`   Approving USDC for ${user.address}...`);
        const usdcApproveTx = await usdcToken.connect(user).approve(spenderAddress, maxApproval);
        await usdcApproveTx.wait();
        console.log(`     ✅ USDC approved`);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Approval failed for ${user.address}: ${error.message}`);
    }
  }
  console.log();
}

async function createSampleOrders(marketplace, deployer, user1, user2) {
  try {
    // Example: Create a buy order (user1 wants to buy 10 sbFT at 1.5 USDC each)
    const sbftAmount = ethers.utils.parseEther("10"); // 10 sbFT
    const usdcPrice = ethers.utils.parseUnits("1.5", 6); // 1.5 USDC per sbFT
    
    console.log("   Creating buy order...");
    console.log(`     Amount: ${ethers.utils.formatEther(sbftAmount)} sbFT`);
    console.log(`     Price: ${ethers.utils.formatUnits(usdcPrice, 6)} USDC per sbFT`);
    
    // Check if user has enough USDC for the buy order
    const totalValue = sbftAmount.mul(usdcPrice).div(ethers.utils.parseEther("1"));
    const userUsdcBalance = await usdcToken.balanceOf(user1.address);
    
    if (userUsdcBalance.gte(totalValue)) {
      const buyOrderTx = await marketplace.connect(user1).createBuyOrder(sbftAmount, usdcPrice);
      const receipt = await buyOrderTx.wait();
      console.log(`     ✅ Buy order created! TX: ${receipt.transactionHash}`);
      
      // Find OrderCreated event
      const orderCreatedEvent = receipt.events?.find(e => e.event === 'OrderCreated');
      if (orderCreatedEvent) {
        console.log(`     📋 Order ID: ${orderCreatedEvent.args?.orderId}`);
      }
    } else {
      console.log(`     ⚠️  User1 doesn't have enough USDC (has ${ethers.utils.formatUnits(userUsdcBalance, 6)}, needs ${ethers.utils.formatUnits(totalValue, 6)})`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error creating buy order: ${error.message}`);
  }
  
  try {
    // Example: Create a sell order (user2 wants to sell 5 sbFT at 1.4 USDC each)
    const sellAmount = ethers.utils.parseEther("5"); // 5 sbFT
    const sellPrice = ethers.utils.parseUnits("1.4", 6); // 1.4 USDC per sbFT
    
    console.log("   Creating sell order...");
    console.log(`     Amount: ${ethers.utils.formatEther(sellAmount)} sbFT`);
    console.log(`     Price: ${ethers.utils.formatUnits(sellPrice, 6)} USDC per sbFT`);
    
    // Check if user has enough sbFT for the sell order
    const userSbftBalance = await sbftToken.balanceOf(user2.address);
    
    if (userSbftBalance.gte(sellAmount)) {
      const sellOrderTx = await marketplace.connect(user2).createSellOrder(sellAmount, sellPrice);
      const receipt = await sellOrderTx.wait();
      console.log(`     ✅ Sell order created! TX: ${receipt.transactionHash}`);
      
      // Find OrderCreated event
      const orderCreatedEvent = receipt.events?.find(e => e.event === 'OrderCreated');
      if (orderCreatedEvent) {
        console.log(`     📋 Order ID: ${orderCreatedEvent.args?.orderId}`);
      }
    } else {
      console.log(`     ⚠️  User2 doesn't have enough sbFT (has ${ethers.utils.formatEther(userSbftBalance)}, needs ${ethers.utils.formatEther(sellAmount)})`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error creating sell order: ${error.message}`);
  }
  
  console.log();
}

async function showMarketStatus(marketplace) {
  try {
    // Get market stats
    const [totalVolume, totalTrades, feesCollected] = await marketplace.getMarketStats();
    console.log(`   Total Volume: ${ethers.utils.formatUnits(totalVolume, 6)} USDC`);
    console.log(`   Total Trades: ${totalTrades.toString()}`);
    console.log(`   Fees Collected: ${ethers.utils.formatUnits(feesCollected, 6)} USDC`);
    
    // Get active orders
    const activeBuyOrders = await marketplace.getActiveBuyOrders();
    const activeSellOrders = await marketplace.getActiveSellOrders();
    console.log(`   Active Buy Orders: ${activeBuyOrders.length}`);
    console.log(`   Active Sell Orders: ${activeSellOrders.length}`);
    
    // Show details of active orders
    if (activeBuyOrders.length > 0) {
      console.log("   📊 Active Buy Orders:");
      for (let i = 0; i < Math.min(activeBuyOrders.length, 5); i++) {
        const order = await marketplace.getOrder(activeBuyOrders[i]);
        const remaining = order.sbftAmount.sub(order.filled);
        console.log(`     Order ${order.id}: ${ethers.utils.formatEther(remaining)} sbFT at ${ethers.utils.formatUnits(order.usdcPrice, 6)} USDC`);
      }
    }
    
    if (activeSellOrders.length > 0) {
      console.log("   📊 Active Sell Orders:");
      for (let i = 0; i < Math.min(activeSellOrders.length, 5); i++) {
        const order = await marketplace.getOrder(activeSellOrders[i]);
        const remaining = order.sbftAmount.sub(order.filled);
        console.log(`     Order ${order.id}: ${ethers.utils.formatEther(remaining)} sbFT at ${ethers.utils.formatUnits(order.usdcPrice, 6)} USDC`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error getting market status: ${error.message}`);
  }
  console.log();
}

// Additional utility functions

async function createBuyOrder(marketplace, signer, sbftAmount, usdcPrice) {
  console.log("Creating buy order...");
  const tx = await marketplace.connect(signer).createBuyOrder(sbftAmount, usdcPrice);
  const receipt = await tx.wait();
  console.log(`Buy order created! TX: ${receipt.transactionHash}`);
  return receipt;
}

async function createSellOrder(marketplace, signer, sbftAmount, usdcPrice) {
  console.log("Creating sell order...");
  const tx = await marketplace.connect(signer).createSellOrder(sbftAmount, usdcPrice);
  const receipt = await tx.wait();
  console.log(`Sell order created! TX: ${receipt.transactionHash}`);
  return receipt;
}

async function cancelOrder(marketplace, signer, orderId) {
  console.log(`Canceling order ${orderId}...`);
  const tx = await marketplace.connect(signer).cancelOrder(orderId);
  const receipt = await tx.wait();
  console.log(`Order ${orderId} canceled! TX: ${receipt.transactionHash}`);
  return receipt;
}

// Run the main function
main()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:");
    console.error(error);
    process.exit(1);
  });

// Export utility functions for use in other scripts
export {
  checkBalances,
  checkAllowances,
  setupApprovals,
  createBuyOrder,
  createSellOrder,
  cancelOrder,
  showMarketStatus
};