import { ethers } from "hardhat";
import { StakeAndBakeNFT } from "../typechain-types/contracts/core/StakeAndBakeNFT.sol";

async function main() {
  console.log("🚀 Starting StakeAndBakeNFT deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "XFI");
  
  // Contract configuration
  const NFT_NAME = "Stake and Bake Master NFT";
  const NFT_SYMBOL = "SBNFT";
  
  // ⚠️ IMPORTANT: Replace these addresses with your actual deployed contract addresses
  const XFI_TOKEN_ADDRESS = "0xF321b818669d56C8f11b3617429cD987c745B0D2"; // Replace with your XFI token address
  const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206"; // Replace with your sbFT token address
  
  // ⚠️ IMPORTANT: Replace with your actual IPFS URI from Pinata
  const TOKEN_URI = "https://ipfs.io/ipfs/bafkreibki2gkw3mqs6emnoqlddxsobkhg5ntlet3273izcn6hlt5xo6odu"; // Replace with your actual IPFS URI
  
  console.log("\n📋 NFT Configuration:");
  console.log(`   Name: ${NFT_NAME}`);
  console.log(`   Symbol: ${NFT_SYMBOL}`);
  console.log(`   XFI Token: ${XFI_TOKEN_ADDRESS}`);
  console.log(`   sbFT Token: ${SBFT_TOKEN_ADDRESS}`);
  console.log(`   Token URI: ${TOKEN_URI}`);
  
  // Validation checks
  // if (XFI_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
  //   console.error("❌ Please set the XFI_TOKEN_ADDRESS to your deployed XFI token address");
  //   process.exit(1);
  // }
  
  // if (SBFT_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
  //   console.error("❌ Please set the SBFT_TOKEN_ADDRESS to your deployed sbFT token address");
  //   process.exit(1);
  // }
  
  // if (TOKEN_URI === "https://ipfs.io/ipfs/YOUR_IPFS_HASH") {
  //   console.error("❌ Please set the TOKEN_URI to your actual IPFS URI from Pinata");
  //   process.exit(1);
  // }
  
  // Deploy the contract
  console.log("\n⏳ Deploying StakeAndBakeNFT contract...");
  const StakeAndBakeNFTFactory = await ethers.getContractFactory("StakeAndBakeNFT");
  
  const stakeAndBakeNFT = await StakeAndBakeNFTFactory.deploy(
    NFT_NAME,
    NFT_SYMBOL,
    XFI_TOKEN_ADDRESS,
    SBFT_TOKEN_ADDRESS,
    TOKEN_URI
  ) as StakeAndBakeNFT;
  
  console.log("⏳ Waiting for deployment confirmation...");
  await stakeAndBakeNFT.deployed();
  
  const contractAddress = stakeAndBakeNFT.address;
  console.log(`✅ StakeAndBakeNFT deployed to: ${contractAddress}`);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await stakeAndBakeNFT.name();
  const symbol = await stakeAndBakeNFT.symbol();
  const xfiToken = await stakeAndBakeNFT.xfiToken();
  const sbftToken = await stakeAndBakeNFT.sbftToken();
  const nftMinted = await stakeAndBakeNFT.nftMinted();
  const currentRound = await stakeAndBakeNFT.currentRound();
  
  console.log("📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   XFI Token: ${xfiToken}`);
  console.log(`   sbFT Token: ${sbftToken}`);
  console.log(`   NFT Minted: ${nftMinted}`);
  console.log(`   Current Round: ${currentRound}`);
  console.log(`   Owner: ${deployer.address}`);
  
  // Test mint Master NFT
  console.log("\n🧪 Testing Master NFT mint...");
  const mintTx = await stakeAndBakeNFT.mintMasterNFT(deployer.address);
  await mintTx.wait();
  
  const nftMintedAfter = await stakeAndBakeNFT.nftMinted();
  const tokenURI = await stakeAndBakeNFT.tokenURI(1);
  
  console.log(`✅ Master NFT minted! NFT Status: ${nftMintedAfter}`);
  console.log(`📸 Token URI: ${tokenURI}`);
  
  // Check distribution status
  const isDistributionDue = await stakeAndBakeNFT.isDistributionDue();
  const timeUntilNext = await stakeAndBakeNFT.getTimeUntilNextDistribution();
  
  console.log(`🔄 Distribution Due: ${isDistributionDue}`);
  console.log(`⏰ Time until next distribution: ${timeUntilNext.toString()} seconds`);
  
  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    nftName: name,
    nftSymbol: symbol,
    xfiTokenAddress: xfiToken,
    sbftTokenAddress: sbftToken,
    tokenURI: tokenURI,
    nftMinted: nftMintedAfter,
    deploymentTime: new Date().toISOString(),
    transactionHash: stakeAndBakeNFT.deployTransaction.hash
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("================================");
  console.log(`Network: ${deploymentInfo.network} (Chain ID: ${deploymentInfo.chainId})`);
  console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`NFT: ${deploymentInfo.nftName} (${deploymentInfo.nftSymbol})`);
  console.log(`XFI Token: ${deploymentInfo.xfiTokenAddress}`);
  console.log(`sbFT Token: ${deploymentInfo.sbftTokenAddress}`);
  console.log(`Token URI: ${deploymentInfo.tokenURI}`);
  console.log(`NFT Minted: ${deploymentInfo.nftMinted}`);
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
  
  const deploymentFile = path.join(deploymentsDir, `stakeandbake-nft-${deploymentInfo.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 StakeAndBakeNFT deployment completed successfully!");
  console.log("\n💡 Next steps:");
  console.log("1. Verify the contract on the explorer if needed");
  console.log("2. Set the staking contract address using setStakingContract()");
  console.log("3. Test the revenue distribution functionality");
  console.log("4. View your NFT metadata at the Token URI");
  console.log("\n🔗 Important Contract Functions:");
  console.log("- setStakingContract(address): Set your staking contract");
  console.log("- distributeFees(uint256): Receive fees from staking");
  console.log("- distributeRevenue(): Distribute weekly rewards");
  console.log("- claimRewards(uint256[]): Claim rewards for specific rounds");
  
  return {
    contract: stakeAndBakeNFT,
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