import { ethers } from "hardhat";
import { IERC20, SbFTMarketplace } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main(): Promise<void> {
  console.log("🔧 SbFTMarketplace Setup Script");
  console.log("===============================\n");
  
  // Your deployed contract addresses
  const MARKETPLACE_ADDRESS = "0x9c07F3E090c5E21295C6111dAD966d057220D36e";
  const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206";
  const USDC_TOKEN_ADDRESS = "0xdEFAA5459ba8DcC24A7470DB4835C97B0fdf85fc";
  
  // Get signer (your account)
  const [signer]: SignerWithAddress[] = await ethers.getSigners();
  console.log(`📝 Using account: ${signer.address}`);
  
  // Get contract instances
  const sbftToken: IERC20 = await ethers.getContractAt("IERC20", SBFT_TOKEN_ADDRESS);
  const usdcToken: IERC20 = await ethers.getContractAt("IERC20", USDC_TOKEN_ADDRESS);
  const marketplace: SbFTMarketplace = await ethers.getContractAt("SbFTMarketplace", MARKETPLACE_ADDRESS);
  
  // Check token balances
  console.log("\n💰 Your Token Balances:");
  const sbftBalance = await sbftToken.balanceOf(signer.address);
  const usdcBalance = await usdcToken.balanceOf(signer.address);
  console.log(`   sbFT: ${ethers.utils.formatEther(sbftBalance)}`);
  console.log(`   USDC: ${ethers.utils.formatUnits(usdcBalance, 6)}`);
  
  // Check current allowances
  console.log("\n🔒 Current Allowances for Marketplace:");
  const sbftAllowance = await sbftToken.allowance(signer.address, MARKETPLACE_ADDRESS);
  const usdcAllowance = await usdcToken.allowance(signer.address, MARKETPLACE_ADDRESS);
  console.log(`   sbFT allowance: ${ethers.utils.formatEther(sbftAllowance)}`);
  console.log(`   USDC allowance: ${ethers.utils.formatUnits(usdcAllowance, 6)}`);
  
  // Setup unlimited approvals (this is what you need to do before creating orders!)
  console.log("\n📝 Setting up unlimited token approvals...");
  
  const maxApproval = ethers.constants.MaxUint256;
  
  // Approve sbFT (needed for sell orders)
  if (sbftBalance.gt(0) && sbftAllowance.lt(sbftBalance)) {
    console.log("   Approving sbFT tokens...");
    const sbftApproveTx = await sbftToken.approve(MARKETPLACE_ADDRESS, maxApproval);
    await sbftApproveTx.wait();
    console.log("   ✅ sbFT tokens approved!");
  }
  
  // Approve USDC (needed for buy orders)
  if (usdcBalance.gt(0) && usdcAllowance.lt(usdcBalance)) {
    console.log("   Approving USDC tokens...");
    const usdcApproveTx = await usdcToken.approve(MARKETPLACE_ADDRESS, maxApproval);
    await usdcApproveTx.wait();
    console.log("   ✅ USDC tokens approved!");
  }
  
  // Verify approvals
  console.log("\n✅ Updated Allowances:");
  const newSbftAllowance = await sbftToken.allowance(signer.address, MARKETPLACE_ADDRESS);
  const newUsdcAllowance = await usdcToken.allowance(signer.address, MARKETPLACE_ADDRESS);
  console.log(`   sbFT allowance: ${ethers.utils.formatEther(newSbftAllowance)}`);
  console.log(`   USDC allowance: ${ethers.utils.formatUnits(newUsdcAllowance, 6)}`);
  
  console.log("\n🎉 Setup Complete! You can now create orders.");
  
  // Show example usage
  console.log("\n📖 Example Order Creation:");
  console.log("// Create buy order - Buy 10 sbFT at 1.5 USDC each");
  console.log("await marketplace.createBuyOrder(");
  console.log("  ethers.utils.parseEther('10'),        // 10 sbFT");
  console.log("  ethers.utils.parseUnits('1.5', 6)     // 1.5 USDC per sbFT");
  console.log(");");
  console.log("");
  console.log("// Create sell order - Sell 5 sbFT at 2.0 USDC each");
  console.log("await marketplace.createSellOrder(");
  console.log("  ethers.utils.parseEther('5'),         // 5 sbFT");
  console.log("  ethers.utils.parseUnits('2.0', 6)     // 2.0 USDC per sbFT");
  console.log(");");
  
  return;
}

main()
  .then(() => {
    console.log("\n✅ Setup script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });