import { ethers } from "hardhat";

// Your contract addresses
const STAKING_CONTRACT_ADDRESS = "0xEb7dF0DFDb6696b827030a32A07dEB8B4a492397";
const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206";

async function main(): Promise<void> {
  console.log("🔄 Resetting Staking System...\n");
  
  try {
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("═".repeat(50));

    // Contract ABIs
    const sbftAbi = [
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function stakingContract() view returns (address)"
    ];

    const stakingAbi = [
      "function getExchangeRate() view returns (uint256)",
      "function totalXFIInPool() view returns (uint256)",
      "function requestUnstake(uint256 sbftAmount)",
      "function getUserUnstakeRequests(address user) view returns (uint256[])",
      "function unstakeRequests(uint256 requestId) view returns (address user, uint256 xfiAmount, uint256 unlockTime, bool processed)",
      "function processUnstake(uint256 requestId)",
      "function canProcessUnstake(uint256 requestId) view returns (bool canProcess, uint256 timeRemaining)",
      "function emergencyUnstake(uint256 sbftAmount, uint256 penaltyRate)"
    ];

    // Get contract instances
    const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, sbftAbi, deployer);
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, deployer);

    console.log("📊 CURRENT STATE");
    console.log("═".repeat(50));

    const totalSupply = await sbftToken.totalSupply();
    const userBalance = await sbftToken.balanceOf(deployer.address);
    const exchangeRate = await stakingContract.getExchangeRate();
    const totalXFI = await stakingContract.totalXFIInPool();

    console.log("Total sbFT Supply:", ethers.utils.formatEther(totalSupply));
    console.log("Your sbFT Balance:", ethers.utils.formatEther(userBalance));
    console.log("Exchange Rate:", ethers.utils.formatEther(exchangeRate));
    console.log("Total XFI in Pool:", ethers.utils.formatEther(totalXFI));

    if (totalSupply.eq(0)) {
      console.log("✅ System already reset - no sbFT tokens in circulation");
      return;
    }

    console.log("\n🔥 BURNING TOKENS VIA EMERGENCY UNSTAKE");
    console.log("═".repeat(50));

    if (userBalance.gt(0)) {
      console.log(`Burning ${ethers.utils.formatEther(userBalance)} sbFT tokens from your balance...`);
      
      try {
        // Use emergency unstake with 0% penalty to burn tokens
        // This will call the staking contract's burn function internally
        const tx = await stakingContract.emergencyUnstake(userBalance, 0);
        console.log("✅ Emergency unstake transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Emergency unstake confirmed in block:", receipt.blockNumber);
        
        // Check new balances
        const newBalance = await sbftToken.balanceOf(deployer.address);
        const newTotalSupply = await sbftToken.totalSupply();
        
        console.log("✅ New balance:", ethers.utils.formatEther(newBalance));
        console.log("✅ New total supply:", ethers.utils.formatEther(newTotalSupply));
        
      } catch (error: any) {
        console.log("❌ Failed to emergency unstake:", error.message);
        
        // Try alternative approach: request unstake then process immediately
        console.log("\n🔄 Trying alternative approach: Request + Process unstake");
        console.log("═".repeat(50));
        
        try {
          // First, request unstake
          console.log("Requesting unstake...");
          const requestTx = await stakingContract.requestUnstake(userBalance);
          const requestReceipt = await requestTx.wait();
          console.log("✅ Unstake requested in block:", requestReceipt.blockNumber);
          
          // Get the request ID from the event
          const requestEvent = requestReceipt.events?.find((e: any) => e.event === 'UnstakeRequested');
          if (requestEvent) {
            const requestId = requestEvent.args?.requestId;
            console.log("Request ID:", requestId.toString());
            
            // Check if we can process immediately (might need to wait for delay)
            const [canProcess, timeRemaining] = await stakingContract.canProcessUnstake(requestId);
            
            if (canProcess) {
              console.log("Processing unstake request...");
              const processTx = await stakingContract.processUnstake(requestId);
              const processReceipt = await processTx.wait();
              console.log("✅ Unstake processed in block:", processReceipt.blockNumber);
            } else {
              console.log(`⏳ Must wait ${timeRemaining} seconds before processing unstake`);
              console.log("You can process this later by calling processUnstake(" + requestId + ")");
            }
          }
          
        } catch (altError: any) {
          console.log("❌ Alternative approach also failed:", altError.message);
          console.log("\n💡 MANUAL STEPS REQUIRED:");
          console.log("1. You may need to contact the contract owner");
          console.log("2. Or wait for the unstaking delay period");
          console.log("3. Check if there are emergency functions available");
          return;
        }
      }
    } else {
      console.log("⚠️  You have no sbFT tokens to burn");
    }

    console.log("\n🧪 TESTING EXCHANGE RATE AFTER RESET");
    console.log("═".repeat(50));

    try {
      const newExchangeRate = await stakingContract.getExchangeRate();
      const newTotalSupply = await sbftToken.totalSupply();
      
      console.log("New Exchange Rate:", ethers.utils.formatEther(newExchangeRate));
      console.log("New Total Supply:", ethers.utils.formatEther(newTotalSupply));
      
      if (newTotalSupply.eq(0)) {
        console.log("🎉 SUCCESS! System reset - ready for fresh staking");
        console.log("   Exchange rate should be 1:1 for first staker");
      } else if (newExchangeRate.gt(0)) {
        console.log("✅ Exchange rate is now valid!");
      } else {
        console.log("⚠️  Other users still hold sbFT tokens");
        console.log("   You may need to contact them or use emergency functions");
      }
      
    } catch (error) {
      console.log("❌ Failed to test exchange rate:", error);
    }

    console.log("\n📋 FINAL STATUS");
    console.log("═".repeat(50));
    
    const finalSupply = await sbftToken.totalSupply();
    const finalRate = await stakingContract.getExchangeRate();
    
    console.log("Final sbFT Supply:", ethers.utils.formatEther(finalSupply));
    console.log("Final Exchange Rate:", ethers.utils.formatEther(finalRate));
    
    if (finalSupply.eq(0)) {
      console.log("🟢 READY: System is reset and ready for staking");
    } else {
      console.log("🟡 PARTIAL: Some tokens still exist - may need admin intervention");
      console.log("\nRemaining token holders need to unstake through the staking contract");
      console.log("Available methods:");
      console.log("- requestUnstake() + processUnstake() (with delay)");
      console.log("- emergencyUnstake() (with optional penalty)");
    }

    // Show pending unstake requests
    try {
      const userRequests = await stakingContract.getUserUnstakeRequests(deployer.address);
      if (userRequests.length > 0) {
        console.log("\n📋 YOUR PENDING UNSTAKE REQUESTS:");
        console.log("═".repeat(50));
        for (let i = 0; i < userRequests.length; i++) {
          const requestId = userRequests[i];
          const request = await stakingContract.unstakeRequests(requestId);
          const [canProcess, timeRemaining] = await stakingContract.canProcessUnstake(requestId);
          
          console.log(`Request ${requestId}:`);
          console.log(`  XFI Amount: ${ethers.utils.formatEther(request.xfiAmount)}`);
          console.log(`  Processed: ${request.processed}`);
          console.log(`  Can Process: ${canProcess}`);
          if (!canProcess && timeRemaining > 0) {
            console.log(`  Time Remaining: ${timeRemaining} seconds`);
          }
          console.log("");
        }
      }
    } catch (error) {
      console.log("Note: Could not fetch unstake requests");
    }

  } catch (error: any) {
    console.error("❌ Script failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });