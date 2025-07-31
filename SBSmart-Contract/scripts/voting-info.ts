import { ethers } from "hardhat";

// Voting Contract ABI (minimal for the functions we need)
const VOTING_ABI = [
  "function getVotingPower(address user) external view returns (uint256)",
  "function MIN_SBFT_TO_PROPOSE() external view returns (uint256)",
  "function proposalCount() external view returns (uint256)",
  "function getActiveProposals() external view returns (uint256[])",
  "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, string title, string description, address proposer, uint256 startTime, uint256 endTime, uint256 yesVotes, uint256 noVotes, uint256 totalVotingPower, bool executed, bool passed, uint8 proposalType))",
  "function hasVoted(uint256 proposalId, address voter) external view returns (bool)",
  "function getVote(uint256 proposalId, address voter) external view returns (tuple(bool support, uint256 votingPower, uint256 timestamp))"
];

async function main() {
  const [signer] = await ethers.getSigners();
  const userAddress = await signer.getAddress();
  
  console.log("🗳️  Voting Contract Info Script");
  console.log("================================");
  console.log(`📍 User Address: ${userAddress}`);
  console.log(`📍 Voting Contract: 0x944611bA3b017E9Ab108Ef6c87308d9411929A12`);
  console.log("");

  try {
    // Connect to voting contract
    const votingContract = new ethers.Contract(
      "0x944611bA3b017E9Ab108Ef6c87308d9411929A12",
      VOTING_ABI,
      signer
    );

    // Get basic voting info
    console.log("💪 VOTING POWER INFO");
    console.log("-------------------");
    
    try {
      const votingPower = await votingContract.getVotingPower(userAddress);
      console.log(`Your Voting Power: ${ethers.utils.formatEther(votingPower)} sbFT`);
    } catch (error) {
      console.log(`❌ Could not get voting power: ${error.message}`);
    }

    try {
      const minSbftToPropose = await votingContract.MIN_SBFT_TO_PROPOSE();
      console.log(`Min sbFT to Propose: ${ethers.utils.formatEther(minSbftToPropose)} sbFT`);
      
      // Check if user can propose (only if we got voting power)
      try {
        const votingPower = await votingContract.getVotingPower(userAddress);
        const canPropose = votingPower.gte(minSbftToPropose);
        console.log(`Can Create Proposals: ${canPropose ? "✅ YES" : "❌ NO"}`);
      } catch (error) {
        console.log(`Can Create Proposals: ❓ Unknown (voting power check failed)`);
      }
    } catch (error) {
      console.log(`❌ Could not get min proposal amount: ${error.message}`);
    }

    console.log("");

    console.log("📊 PROPOSAL STATS");
    console.log("-----------------");
    
    try {
      const proposalCount = await votingContract.proposalCount();
      console.log(`Total Proposals Created: ${proposalCount.toString()}`);
    } catch (error) {
      console.log(`❌ Could not get proposal count: ${error.message}`);
    }

    try {
      const activeProposals = await votingContract.getActiveProposals();
      console.log(`Active Proposals: ${activeProposals.length}`);
      console.log("");

      // Show active proposals if any
      if (activeProposals.length > 0) {
        console.log("🔥 ACTIVE PROPOSALS");
        console.log("------------------");
        
        for (let i = 0; i < activeProposals.length; i++) {
          const proposalId = activeProposals[i];
          console.log(`\n📋 Proposal #${proposalId.toString()}`);
          
          try {
            const proposal = await votingContract.getProposal(proposalId);
            
            const startTime = new Date(proposal.startTime.toNumber() * 1000);
            const endTime = new Date(proposal.endTime.toNumber() * 1000);
            const now = new Date();
            
            const totalVotes = proposal.yesVotes.add(proposal.noVotes);
            const yesPercentage = totalVotes.gt(0) ? 
              proposal.yesVotes.mul(100).div(totalVotes).toString() : "0";
            const noPercentage = totalVotes.gt(0) ? 
              proposal.noVotes.mul(100).div(totalVotes).toString() : "0";
            
            const proposalTypes = ["Reward Rate Change", "Fee Change", "Parameter Change", "General"];
            
            console.log(`   Title: ${proposal.title}`);
            console.log(`   Description: ${proposal.description.substring(0, 100)}${proposal.description.length > 100 ? '...' : ''}`);
            console.log(`   Type: ${proposalTypes[proposal.proposalType] || "Unknown"}`);
            console.log(`   Proposer: ${proposal.proposer}`);
            
            let status = "🟢 ACTIVE";
            if (proposal.executed) {
              status = proposal.passed ? "✅ PASSED" : "❌ FAILED";
            } else if (now > endTime) {
              status = "⏰ ENDED";
            }
            console.log(`   Status: ${status}`);
            
            console.log(`   Voting Period: ${startTime.toLocaleDateString()} - ${endTime.toLocaleDateString()}`);
            console.log(`   Votes: Yes ${ethers.utils.formatEther(proposal.yesVotes)} (${yesPercentage}%) | No ${ethers.utils.formatEther(proposal.noVotes)} (${noPercentage}%)`);
            
            // Check if user has voted
            try {
              const hasUserVoted = await votingContract.hasVoted(proposalId, userAddress);
              console.log(`   Your Vote: ${hasUserVoted ? "✅ VOTED" : "⭕ NOT VOTED"}`);
              
              if (hasUserVoted) {
                try {
                  const userVote = await votingContract.getVote(proposalId, userAddress);
                  console.log(`   You Voted: ${userVote.support ? "👍 YES" : "👎 NO"} with ${ethers.utils.formatEther(userVote.votingPower)} sbFT`);
                } catch (error) {
                  console.log(`   Vote details unavailable: ${error.message.substring(0, 50)}...`);
                }
              }
              
            } catch (error) {
              console.log(`   ❌ Could not check vote status: ${error.message.substring(0, 50)}...`);
            }
            
          } catch (error) {
            console.log(`   ❌ Error loading proposal details: ${error.message.substring(0, 50)}...`);
          }
        }
      } else {
        console.log("📭 No active proposals at the moment");
      }
      
    } catch (error) {
      console.log(`❌ Could not get active proposals: ${error.message}`);
    }

    console.log("\n✨ Script completed!");

  } catch (error) {
    console.error("❌ Major Error:", error.message);
    
    // More specific error checking
    if (error.message?.includes("call revert exception")) {
      console.log("\n💡 Troubleshooting:");
      console.log("- The contract exists but function calls are failing");
      console.log("- This could be an ABI mismatch");
      console.log("- Or the contract might not be fully initialized");
      console.log("- Try checking what functions are actually available");
    }
  }
}

// Simple function tester
async function testBasicFunctions() {
  console.log("🧪 Testing Basic Contract Functions");
  console.log("==================================");
  
  const [signer] = await ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Test simple functions first
  const simpleFunctions = [
    "function proposalCount() view returns (uint256)",
    "function MIN_SBFT_TO_PROPOSE() view returns (uint256)",
    "function owner() view returns (address)"
  ];
  
  for (const func of simpleFunctions) {
    try {
      const contract = new ethers.Contract(contractAddress, [func], signer);
      const funcName = func.split(" ")[1].split("(")[0];
      const result = await contract[funcName]();
      
      console.log(`✅ ${funcName}(): ${result.toString()}`);
    } catch (error) {
      console.log(`❌ ${func.split(" ")[1]}: ${error.message.substring(0, 50)}...`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Export test function for manual use if needed
export { testBasicFunctions };