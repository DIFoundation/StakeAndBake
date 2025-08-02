import { ethers } from "hardhat";

// Replace these with your actual contract addresses
const STAKING_CONTRACT_ADDRESS = "0x9b5ff784A1bd9863Bb5accBE6508Cef544d497eB";
const XFI_TOKEN_ADDRESS = "0xF321b818669d56C8f11b3617429cD987c745B0D2";
const SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535";

async function main(): Promise<void> {
  console.log("🚀 Starting Staking Contract Tests...\n");
  
  try {
    // Get signers - handle case where only one signer is available
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const user = signers[1] || deployer; // Use deployer as user if no second signer
    
    console.log("Deployer:", deployer.address);
    console.log("Test User:", user.address);
    console.log("═".repeat(50));

    // Contract ABIs (minimal for testing)
    const stakingAbi = [
      "function getExchangeRate() view returns (uint256)",
      "function totalXFIInPool() view returns (uint256)",
      "function totalPendingUnstakes() view returns (uint256)",
      "function unstakingDelay() view returns (uint256)",
      "function minStake() view returns (uint256)",
      "function getMinStake() view returns (uint256)",
      "function annualRewardRate() view returns (uint256)",
      "function lastRewardUpdate() view returns (uint256)",
      "function stake(uint256 amount)",
      "function xfiToken() view returns (address)",
      "function sbftToken() view returns (address)",
      "function owner() view returns (address)"
    ];

    const tokenAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)"
    ];

    // Get contract instances
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, user);
    const xfiToken = new ethers.Contract(XFI_TOKEN_ADDRESS, tokenAbi, user);
    const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, tokenAbi, user);

    console.log("📋 BASIC CONTRACT VERIFICATION");
    console.log("═".repeat(50));

    // Get token decimals first for proper formatting
    let xfiDecimals = 18;
    let sbftDecimals = 18;
    
    try {
      xfiDecimals = await xfiToken.decimals();
      sbftDecimals = await sbftToken.decimals();
      console.log(`✅ XFI Decimals: ${xfiDecimals}`);
      console.log(`✅ sbFT Decimals: ${sbftDecimals}`);
    } catch (error: any) {
      console.log("⚠️  Using default 18 decimals for formatting");
    }

    // Helper function to format tokens with correct decimals (ethers v5 compatible)
    function formatTokens(amount: any, decimals: number): string {
      return ethers.utils.formatUnits(amount, decimals);
    }

    // Test 1: Basic contract connectivity
    try {
      const stakingOwner = await stakingContract.owner();
      console.log("✅ Staking Contract Owner:", stakingOwner);
    } catch (error: any) {
      console.log("❌ Failed to get staking contract owner:", error.message);
      return;
    }

    try {
      const xfiName = await xfiToken.name();
      const xfiSymbol = await xfiToken.symbol();
      console.log(`✅ XFI Token: ${xfiName} (${xfiSymbol})`);
    } catch (error: any) {
      console.log("❌ Failed to get XFI token info:", error.message);
    }

    try {
      const sbftName = await sbftToken.name();
      const sbftSymbol = await sbftToken.symbol();
      console.log(`✅ sbFT Token: ${sbftName} (${sbftSymbol})`);
    } catch (error: any) {
      console.log("❌ Failed to get sbFT token info:", error.message);
    }

    console.log("\n📊 CONTRACT STATE VERIFICATION");
    console.log("═".repeat(50));

    // Test 2: Contract state
    try {
      const exchangeRate = await stakingContract.getExchangeRate();
      console.log(`✅ Exchange Rate: ${formatTokens(exchangeRate, 18)} XFI per sbFT`);
      
      if (exchangeRate.eq(0)) {
        console.log("⚠️  WARNING: Exchange rate is 0!");
      }
    } catch (error: any) {
      console.log("❌ Failed to get exchange rate:", error.message);
    }

    try {
      const totalXFI = await stakingContract.totalXFIInPool();
      console.log(`✅ Total XFI in Pool: ${formatTokens(totalXFI, xfiDecimals)} XFI`);
    } catch (error: any) {
      console.log("❌ Failed to get total XFI in pool:", error.message);
    }

    try {
      const minStake = await stakingContract.getMinStake();
      console.log(`✅ Minimum Stake: ${formatTokens(minStake, xfiDecimals)} XFI`);
    } catch (error: any) {
      console.log("❌ Failed to get minimum stake:", error.message);
    }

    try {
      const unstakingDelay = await stakingContract.unstakingDelay();
      const days = Number(unstakingDelay) / (24 * 60 * 60);
      console.log(`✅ Unstaking Delay: ${days} days`);
    } catch (error: any) {
      console.log("❌ Failed to get unstaking delay:", error.message);
    }

    try {
      const rewardRate = await stakingContract.annualRewardRate();
      console.log(`✅ Annual Reward Rate: ${Number(rewardRate) / 100}%`);
    } catch (error: any) {
      console.log("❌ Failed to get reward rate:", error.message);
    }

    console.log("\n👤 USER BALANCE VERIFICATION");
    console.log("═".repeat(50));

    // Test 3: User balances
    try {
      const userXFIBalance = await xfiToken.balanceOf(user.address);
      console.log(`✅ User XFI Balance: ${formatTokens(userXFIBalance, xfiDecimals)} XFI`);
      
      if (userXFIBalance.eq(0)) {
        console.log("⚠️  WARNING: User has 0 XFI balance!");
      }
    } catch (error: any) {
      console.log("❌ Failed to get user XFI balance:", error.message);
    }

    try {
      const userSbFTBalance = await sbftToken.balanceOf(user.address);
      console.log(`✅ User sbFT Balance: ${formatTokens(userSbFTBalance, sbftDecimals)} sbFT`);
    } catch (error: any) {
      console.log("❌ Failed to get user sbFT balance:", error.message);
    }

    try {
      const allowance = await xfiToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
      console.log(`✅ Current Allowance: ${formatTokens(allowance, xfiDecimals)} XFI`);
    } catch (error: any) {
      console.log("❌ Failed to get allowance:", error.message);
    }

    console.log("\n🧮 STAKING CALCULATION TEST");
    console.log("═".repeat(50));

    // Test 4: Staking calculations
    const testAmount = "1"; // 1 XFI
    try {
      const exchangeRate = await stakingContract.getExchangeRate();
      const amountWei = ethers.utils.parseUnits(testAmount, xfiDecimals);
      const fee = amountWei.div(100); // 1% fee
      const netAmount = amountWei.sub(fee);
      
      let expectedSbFT = ethers.BigNumber.from(0);
      if (exchangeRate.gt(0)) {
        expectedSbFT = netAmount.mul(ethers.utils.parseUnits("1", sbftDecimals)).div(exchangeRate);
      }
      
      console.log(`📝 Staking ${testAmount} XFI:`);
      console.log(`   - Amount in wei: ${amountWei.toString()}`);
      console.log(`   - Fee (1%): ${formatTokens(fee, xfiDecimals)} XFI`);
      console.log(`   - Net amount: ${formatTokens(netAmount, xfiDecimals)} XFI`);
      console.log(`   - Exchange rate: ${formatTokens(exchangeRate, 18)}`);
      console.log(`   - Expected sbFT: ${formatTokens(expectedSbFT, sbftDecimals)} sbFT`);
      
      if (expectedSbFT.eq(0)) {
        console.log("❌ PROBLEM: Expected sbFT is 0!");
        console.log("   This suggests an issue with exchange rate calculation");
      } else {
        console.log("✅ Calculation looks correct");
      }
    } catch (error: any) {
      console.log("❌ Failed to calculate expected sbFT:", error.message);
    }

    console.log("\n🔧 APPROVAL TEST");
    console.log("═".repeat(50));

    // Test 5: Try approval (but don't actually do it unless user has balance)
    try {
      const userBalance = await xfiToken.balanceOf(user.address);
      if (userBalance.gt(0)) {
        console.log("💡 User has XFI balance, testing approval...");
        
        // Test approval with 1 XFI
        const approvalAmount = ethers.utils.parseUnits("1", xfiDecimals);
        const tx = await xfiToken.approve(STAKING_CONTRACT_ADDRESS, approvalAmount);
        console.log(`✅ Approval transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Approval confirmed in block: ${receipt?.blockNumber}`);
        
        // Check new allowance
        const newAllowance = await xfiToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
        console.log(`✅ New allowance: ${formatTokens(newAllowance, xfiDecimals)} XFI`);
        
      } else {
        console.log("⚠️  Skipping approval test - user has no XFI balance");
      }
    } catch (error: any) {
      console.log("❌ Approval test failed:", error.message);
    }

    console.log("\n🎯 STAKING TEST");
    console.log("═".repeat(50));

    // Test 6: Try actual staking (only if user has balance and allowance)
    try {
      const userBalance = await xfiToken.balanceOf(user.address);
      const allowance = await xfiToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
      const minStake = await stakingContract.getMinStake();
      
      if (userBalance.gte(minStake) && allowance.gte(minStake)) {
        console.log("💡 User has sufficient balance and allowance, testing staking...");
        
        // First check if exchange rate is valid
        const exchangeRate = await stakingContract.getExchangeRate();
        if (exchangeRate.eq(0)) {
          console.log("❌ Cannot stake: Exchange rate is 0");
          console.log("   Need to initialize the contract first");
          return;
        }
        
        const stakeAmount = minStake; // Stake minimum amount
        const tx = await stakingContract.stake(stakeAmount);
        console.log(`✅ Staking transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Staking confirmed in block: ${receipt?.blockNumber}`);
        
        // Check new balances
        const newXFIBalance = await xfiToken.balanceOf(user.address);
        const newSbFTBalance = await sbftToken.balanceOf(user.address);
        
        console.log(`✅ New XFI balance: ${formatTokens(newXFIBalance, xfiDecimals)} XFI`);
        console.log(`✅ New sbFT balance: ${formatTokens(newSbFTBalance, sbftDecimals)} sbFT`);
        
      } else {
        console.log("⚠️  Skipping staking test:");
        console.log(`   - User balance: ${formatTokens(userBalance, xfiDecimals)} XFI`);
        console.log(`   - Required: ${formatTokens(minStake, xfiDecimals)} XFI`);
        console.log(`   - Allowance: ${formatTokens(allowance, xfiDecimals)} XFI`);
      }
    } catch (error: any) {
      console.log("❌ Staking test failed:", error.message);
      console.log("Error details:", error);
    }

    console.log("\n📋 SUMMARY");
    console.log("═".repeat(50));
    
    // Final summary
    let exchangeRate = ethers.BigNumber.from(0);
    let userBalance = ethers.BigNumber.from(0);
    let allowance = ethers.BigNumber.from(0);
    
    try {
      exchangeRate = await stakingContract.getExchangeRate();
      userBalance = await xfiToken.balanceOf(user.address);
      allowance = await xfiToken.allowance(user.address, STAKING_CONTRACT_ADDRESS);
    } catch (error) {
      console.log("❌ Failed to get final summary data");
    }
    
    console.log("Contract Status:");
    console.log(`  Exchange Rate: ${exchangeRate.gt(0) ? "✅ Valid" : "❌ Invalid (0)"}`);
    console.log(`  User Balance: ${userBalance.gt(0) ? "✅ Has XFI" : "❌ No XFI"}`);
    console.log(`  Allowance: ${allowance.gt(0) ? "✅ Approved" : "❌ Not approved"}`);
    
    if (exchangeRate.eq(0)) {
      console.log("\n🔍 DIAGNOSIS: Exchange rate is 0");
      console.log("This is likely why your frontend shows '0 sbFT tokens'");
      console.log("Possible causes:");
      console.log("  - Contract not properly initialized");
      console.log("  - No XFI in the staking pool yet");
      console.log("  - Contract deployment issue");
      console.log("  - Need to call initialization function");
      
      // Add specific diagnosis for this contract
      console.log("\n💡 SOLUTION:");
      console.log("Your contract uses a liquid staking model where:");
      console.log("  1. Initial exchange rate should be 1:1 (1e18)");
      console.log("  2. Rate increases over time with rewards");
      console.log("  3. If rate is 0, there might be an issue with totalSupply()");
      
      try {
        const sbftSupply = await sbftToken.totalSupply();
        const totalXFI = await stakingContract.totalXFIInPool();
        console.log(`\n📊 Contract State:`);
        console.log(`  - sbFT Total Supply: ${formatTokens(sbftSupply, sbftDecimals)}`);
        console.log(`  - Total XFI in Pool: ${formatTokens(totalXFI, xfiDecimals)}`);
        
        if (sbftSupply.eq(0) && totalXFI.eq(0)) {
          console.log("  ✅ This is normal for a new contract - first staker gets 1:1 rate");
        }
      } catch (error) {
        console.log("  ❌ Could not check contract state");
      }
    }
    
  } catch (error: any) {
    console.error("❌ Test script failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });