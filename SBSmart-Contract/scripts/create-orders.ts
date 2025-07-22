import hre from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main(): Promise<void> {
  console.log("📊 Create Orders on SbFTMarketplace");
  console.log("===================================\n");
  
  // Your deployed contract address
  const MARKETPLACE_ADDRESS: string = "0x9c07F3E090c5E21295C6111dAD966d057220D36e";
  
  // Get signer
  const [signer]: SignerWithAddress[] = await hre.ethers.getSigners();
  console.log(`📝 Using account: ${signer.address}`);
  
  // Get marketplace contract
  const marketplace: Contract = await hre.ethers.getContractAt("SbFTMarketplace", MARKETPLACE_ADDRESS);
  
  // Check market status before
  console.log("\n📈 Market Status Before:");
  await showMarketStatus(marketplace);
  
  // Example 1: Create a BUY order
  console.log("\n🛒 Creating Buy Order...");
  try {
    const buyAmount = hre.ethers.utils.parseEther("10");    // Buy 10 sbFT
    const buyPrice = hre.ethers.utils.parseUnits("1.5", 6); // At 1.5 USDC per sbFT
    
    console.log(`   Amount: ${hre.ethers.utils.formatEther(buyAmount)} sbFT`);
    console.log(`   Price: ${hre.ethers.utils.formatUnits(buyPrice, 6)} USDC per sbFT`);
    console.log(`   Total Cost: ${hre.ethers.utils.formatUnits(buyAmount.mul(buyPrice).div(hre.ethers.utils.parseEther("1")), 6)} USDC`);
    
    const buyTx = await marketplace.createBuyOrder(buyAmount, buyPrice);
    const buyReceipt = await buyTx.wait();
    
    console.log(`   ✅ Buy order created! TX: ${buyReceipt.transactionHash}`);
    
    // Get order ID from event
    const orderEvent = buyReceipt.events?.find((e: any) => e.event === 'OrderCreated');
    if (orderEvent) {
      console.log(`   📋 Order ID: ${orderEvent.args?.orderId}`);
    }
    
  } catch (error: any) {
    console.log(`   ❌ Buy order failed: ${error.message}`);
  }
  
  // Example 2: Create a SELL order
  console.log("\n💰 Creating Sell Order...");
  try {
    const sellAmount = hre.ethers.utils.parseEther("5");     // Sell 5 sbFT
    const sellPrice = hre.ethers.utils.parseUnits("2.0", 6); // At 2.0 USDC per sbFT
    
    console.log(`   Amount: ${hre.ethers.utils.formatEther(sellAmount)} sbFT`);
    console.log(`   Price: ${hre.ethers.utils.formatUnits(sellPrice, 6)} USDC per sbFT`);
    console.log(`   Total Value: ${hre.ethers.utils.formatUnits(sellAmount.mul(sellPrice).div(hre.ethers.utils.parseEther("1")), 6)} USDC`);
    
    const sellTx = await marketplace.createSellOrder(sellAmount, sellPrice);
    const sellReceipt = await sellTx.wait();
    
    console.log(`   ✅ Sell order created! TX: ${sellReceipt.transactionHash}`);
    
    // Get order ID from event
    const orderEvent = sellReceipt.events?.find((e: any) => e.event === 'OrderCreated');
    if (orderEvent) {
      console.log(`   📋 Order ID: ${orderEvent.args?.orderId}`);
    }
    
  } catch (error: any) {
    console.log(`   ❌ Sell order failed: ${error.message}`);
  }
  
  // Show market status after
  console.log("\n📈 Market Status After:");
  await showMarketStatus(marketplace);
  
  // Show user's orders
  console.log("\n👤 Your Orders:");
  const userOrders = await marketplace.getUserOrders(signer.address);
  console.log(`   Total orders created: ${userOrders.length}`);
  
  for (let i = 0; i < userOrders.length; i++) {
    const order = await marketplace.getOrder(userOrders[i]);
    const remaining = order.sbftAmount.sub(order.filled);
    const status = order.active ? "Active" : "Inactive";
    const type = order.isBuyOrder ? "BUY" : "SELL";
    
    console.log(`   Order ${order.id} (${type}): ${hre.ethers.utils.formatEther(remaining)} sbFT at ${hre.ethers.utils.formatUnits(order.usdcPrice, 6)} USDC - ${status}`);
  }
  
  console.log("\n🎉 Order creation completed!");
}

async function showMarketStatus(marketplace: Contract): Promise<void> {
  try {
    const [totalVolume, totalTrades, feesCollected] = await marketplace.getMarketStats();
    const activeBuyOrders = await marketplace.getActiveBuyOrders();
    const activeSellOrders = await marketplace.getActiveSellOrders();
    
    console.log(`   Volume: ${hre.ethers.utils.formatUnits(totalVolume, 6)} USDC`);
    console.log(`   Trades: ${totalTrades.toString()}`);
    console.log(`   Fees: ${hre.ethers.utils.formatUnits(feesCollected, 6)} USDC`);
    console.log(`   Active Buy Orders: ${activeBuyOrders.length}`);
    console.log(`   Active Sell Orders: ${activeSellOrders.length}`);
  } catch (error: any) {
    console.log(`   ❌ Error getting market status: ${error.message}`);
  }
}

// Helper function to cancel an order
async function cancelOrder(orderId: string | number): Promise<void> {
  const MARKETPLACE_ADDRESS: string = "0x9c07F3E090c5E21295C6111dAD966d057220D36e";
  const [signer]: SignerWithAddress[] = await hre.ethers.getSigners();
  const marketplace: Contract = await hre.ethers.getContractAt("SbFTMarketplace", MARKETPLACE_ADDRESS);
  
  console.log(`🗑️ Canceling order ${orderId}...`);
  try {
    const cancelTx = await marketplace.cancelOrder(orderId);
    await cancelTx.wait();
    console.log(`✅ Order ${orderId} canceled!`);
  } catch (error: any) {
    console.log(`❌ Cancel failed: ${error.message}`);
  }
}

main()
  .then(() => {
    console.log("\n✅ Order creation script completed!");
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });

// Export the cancel function for standalone use
export { cancelOrder };