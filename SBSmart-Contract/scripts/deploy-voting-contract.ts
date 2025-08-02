// scripts/deploy-voting-contract.ts
import { ethers, network, run } from "hardhat";

async function main() {

  const SBFT_TOKEN_ADDRESS: string = "0x9c020d7AF67aB9B77488E9554bC09dDBB2348535";

    if (!ethers.utils.isAddress(SBFT_TOKEN_ADDRESS)) {
    console.error("ERROR: Invalid sbFT token contract address.");
    process.exit(1);
  }

  console.log("Deploying VotingContract with sbFT Token address:", SBFT_TOKEN_ADDRESS);

  const VotingContract = await ethers.getContractFactory("VotingContract");

  const votingContract = await VotingContract.deploy(SBFT_TOKEN_ADDRESS);

  await votingContract.deployed();

  const contractAddress = votingContract.address;

  console.log("VotingContract deployed to:", contractAddress);

  // --- Optional: Verify the contract on Etherscan ---
  // You'll need an Etherscan API key configured in hardhat.config.ts for this.
  // This step is crucial for public testnets/mainnet for transparency.
  if (network.config.chainId !== 31337 && network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [SBFT_TOKEN_ADDRESS],
      });
      console.log("Contract verified successfully!");
    } catch (error: any) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("Contract is already verified!");
      } else {
        console.error("Error verifying contract:", error);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});