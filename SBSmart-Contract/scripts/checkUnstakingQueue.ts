import { ethers } from "hardhat";

// Your contract addresses
const STAKING_CONTRACT_ADDRESS = "0x9b5ff784A1bd9863Bb5accBE6508Cef544d497eB";
const SBFT_TOKEN_ADDRESS = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535"; // Update if different
const XFI_TOKEN_ADDRESS = "0x..."; // Add your XFI token address

// Add your wallet address to check
const USER_ADDRESS = "0xB24023434c3670E100068C925A87fE8F500d909a"; // Replace with your wallet address

async function main(): Promise<void> {
  console.log("🔍 CHECKING UNSTAKING QUEUE");
  console.log("═".repeat(60));
  
  try {
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer/Checker:", deployer.address);
    console.log("Target User:", USER_ADDRESS || deployer.address);
    console.log("-".repeat(60));

    // Contract ABIs
    const stakingAbi = [
      // Read functions
      "function totalXFIInPool() view returns (uint256)",
      "function totalPendingUnstakes() view returns (uint256)",
      "function getExchangeRate() view returns (uint256)",
      "function unstakingDelay() view returns (uint256)",
      "function unstakeRequestCount() view returns (uint256)",
      
      // User-specific functions
      "function getUserUnstakeRequests(address user) view returns (uint256[])",
      "function unstakeRequests(uint256 requestId) view returns (address user, uint256 xfiAmount, uint256 unlockTime, bool processed)",
      "function canProcessUnstake(uint256 requestId) view returns (bool canProcess, uint256 timeRemaining)",
      
      // Balance functions
      "function getAvailableXFI() view returns (uint256)"
    ];

    const tokenAbi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ];

    // Get contract instances
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, deployer);
    const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, tokenAbi, deployer);

    const targetUser = USER_ADDRESS || deployer.address;

    console.log("📊 GLOBAL POOL STATUS");
    console.log("═".repeat(60));

    // Get global stats
    try {
      const totalXFIInPool = await stakingContract.totalXFIInPool();
      const totalPendingUnstakes = await stakingContract.totalPendingUnstakes();
      const exchangeRate = await stakingContract.getExchangeRate();
      const unstakingDelay = await stakingContract.unstakingDelay();
      const unstakeRequestCount = await stakingContract.unstakeRequestCount();
      const availableXFI = await stakingContract.getAvailableXFI();
      const sbftTotalSupply = await sbftToken.totalSupply();

      console.log("Total XFI in Pool:", ethers.utils.formatEther(totalXFIInPool), "XFI");
      console.log("Total Pending Unstakes:", ethers.utils.formatEther(totalPendingUnstakes), "XFI");
      console.log("Available XFI for Unstaking:", ethers.utils.formatEther(availableXFI), "XFI");
      console.log("Exchange Rate:", ethers.utils.formatEther(exchangeRate), "XFI per sbFT");
      console.log("Unstaking Delay:", Number(unstakingDelay) / 86400, "days");
      console.log("Total Unstake Requests Ever:", unstakeRequestCount.toString());
      console.log("Total sbFT Supply:", ethers.utils.formatEther(sbftTotalSupply), "sbFT");

    } catch (error) {
      console.log("❌ Failed to get global stats:", error);
    }

    console.log("\n👤 USER BALANCE STATUS");
    console.log("═".repeat(60));

    // Get user balances
    try {
      const sbftBalance = await sbftToken.balanceOf(targetUser);
      console.log("User sbFT Balance:", ethers.utils.formatEther(sbftBalance), "sbFT");
      
      // Calculate XFI value
      const exchangeRate = await stakingContract.getExchangeRate();
      const xfiValue = sbftBalance.mul(exchangeRate).div(ethers.utils.parseEther("1"));
      console.log("User XFI Value:", ethers.utils.formatEther(xfiValue), "XFI");
      
    } catch (error) {
      console.log("❌ Failed to get user balance:", error);
    }

    console.log("\n🔍 USER UNSTAKING QUEUE");
    console.log("═".repeat(60));

    // Get user's unstake requests
    try {
      const userRequests = await stakingContract.getUserUnstakeRequests(targetUser);
      console.log("Number of User Requests:", userRequests.length);
      
      if (userRequests.length === 0) {
        console.log("✅ No unstake requests found for this user");
        console.log("\n💡 POSSIBLE REASONS FOR EMPTY QUEUE:");
        console.log("   1. User hasn't made any unstake requests yet");
        console.log("   2. All requests have been processed/cancelled");
        console.log("   3. Frontend is checking wrong address");
        console.log("   4. Contract interaction issues");
      } else {
        console.log("\n📋 DETAILED REQUEST INFORMATION:");
        console.log("-".repeat(60));
        
        for (let i = 0; i < userRequests.length; i++) {
          const requestId = userRequests[i];
          console.log(`\n🎫 REQUEST #${requestId.toString()}`);
          console.log("-".repeat(30));
          
          try {
            // Get request details
            const requestData = await stakingContract.unstakeRequests(requestId);
            const [user, xfiAmount, unlockTime, processed] = requestData;
            
            console.log("User:", user);
            console.log("XFI Amount:", ethers.utils.formatEther(xfiAmount), "XFI");
            console.log("Unlock Time:", new Date(Number(unlockTime) * 1000).toLocaleString());
            console.log("Processed:", processed);
            
            if (!processed) {
              // Check if can be processed
              try {
                const canProcessData = await stakingContract.canProcessUnstake(requestId);
                const [canProcess, timeRemaining] = canProcessData;
                
                console.log("Can Process Now:", canProcess);
                
                if (!canProcess && timeRemaining.gt(0)) {
                  const seconds = Number(timeRemaining);
                  const days = Math.floor(seconds / 86400);
                  const hours = Math.floor((seconds % 86400) / 3600);
                  const minutes = Math.floor((seconds % 3600) / 60);
                  
                  console.log("Time Remaining:", `${days}d ${hours}h ${minutes}m`);
                } else if (canProcess) {
                  console.log("🎉 READY TO CLAIM!");
                }
                
              } catch (error) {
                console.log("❌ Failed to check processing status:", error);
              }
            } else {
              console.log("✅ Already processed");
            }
            
          } catch (error) {
            console.log("❌ Failed to get request details:", error);
          }
        }
      }
      
    } catch (error) {
      console.log("❌ Failed to get user unstake requests:", error);
      console.log("Error details:", error);
    }

    console.log("\n🔍 ALL RECENT UNSTAKE REQUESTS (GLOBAL)");
    console.log("═".repeat(60));

    // Check last 10 requests globally to see if there are any
    try {
      const totalRequests = await stakingContract.unstakeRequestCount();
      const startFrom = totalRequests.gt(10) ? totalRequests.sub(10) : ethers.BigNumber.from(0);
      
      console.log(`Checking last ${totalRequests.toString()} requests (starting from ${startFrom.toString()})`);
      
      let foundRequests = 0;
      
      for (let i = startFrom.toNumber(); i < totalRequests.toNumber(); i++) {
        try {
          const requestData = await stakingContract.unstakeRequests(i);
          const [user, xfiAmount, unlockTime, processed] = requestData;
          
          if (user !== ethers.constants.AddressZero) {
            foundRequests++;
            console.log(`\nGlobal Request #${i}:`);
            console.log("  User:", user);
            console.log("  Amount:", ethers.utils.formatEther(xfiAmount), "XFI");
            console.log("  Processed:", processed);
            console.log("  Is Target User:", user.toLowerCase() === targetUser.toLowerCase() ? "YES ✅" : "NO");
          }
        } catch (error) {
          console.log(`❌ Failed to get request ${i}:`, error);
        }
      }
      
      if (foundRequests === 0) {
        console.log("No recent unstake requests found globally");
      }
      
    } catch (error) {
      console.log("❌ Failed to check global requests:", error);
    }

    console.log("\n🔧 FRONTEND DEBUGGING HINTS");
    console.log("═".repeat(60));
    console.log("1. Check if frontend is using correct contract address:");
    console.log("   Expected:", STAKING_CONTRACT_ADDRESS);
    console.log("2. Check if frontend is using correct user address:");
    console.log("   Expected:", targetUser);
    console.log("3. Check if getUserUnstakeRequests is being called correctly");
    console.log("4. Check browser console for any errors");
    console.log("5. Verify wagmi configuration and contract ABI");
    console.log("6. Check if the query is enabled and refreshing properly");

    console.log("\n✅ SCRIPT COMPLETED");
    
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