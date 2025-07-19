import { ethers } from "hardhat";
import { SbFTToken } from "../typechain-types/contracts/tokens/sbFTToken.sol";

async function main() {
  console.log("🚀 Starting sbFT Token deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Token configuration
  const TOKEN_NAME = "Stake and Bake Fractional Token";
  const TOKEN_SYMBOL = "sbFT";

  // Deploy the contract
  console.log("\n⏳ Deploying sbFT Token contract...");
  const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
  const sbftToken = (await SbFTTokenFactory.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL
  )) as SbFTToken;
  await sbftToken.deployed();
  console.log(`✅ sbFT Token deployed to: ${sbftToken.address}`);

  // —— NEW: Set deployer as the staking contract ——
  console.log("\n🔧 Configuring staking contract...");
  const txSet = await sbftToken.setStakingContract(deployer.address);
  await txSet.wait();
  console.log(`✅ stakingContract set to deployer: ${deployer.address}`);

  // Verify deployment
  const [name, symbol, decimals, totalSupply, ownerBalance] = await Promise.all([
    sbftToken.name(),
    sbftToken.symbol(),
    sbftToken.decimals(),
    sbftToken.totalSupply(),
    sbftToken.balanceOf(deployer.address),
  ]);
  console.log("\n📊 Contract Details:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(
    `   Total Supply: ${ethers.utils.formatEther(totalSupply)} ${symbol}`
  );
  console.log(
    `   Owner Balance: ${ethers.utils.formatEther(ownerBalance)} ${symbol}`
  );

  // Test mint function
  console.log("\n🧪 Testing mint function...");
  const testMintAmount = ethers.utils.parseEther("100"); // 100 tokens
  const mintTx = await sbftToken.mint(deployer.address, testMintAmount);
  await mintTx.wait();
  const newBalance = await sbftToken.balanceOf(deployer.address);
  console.log(
    `✅ Minted 100 tokens. New balance: ${ethers.utils.formatEther(
      newBalance
    )} ${symbol}`
  );

  // ...rest of your logging and file-writing code...
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
