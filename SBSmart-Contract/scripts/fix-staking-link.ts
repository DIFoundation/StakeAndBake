import { ethers } from "hardhat";

// Your contract addresses
const STAKING_CONTRACT_ADDRESS = "0xEb7dF0DFDb6696b827030a32A07dEB8B4a492397";
const SBFT_TOKEN_ADDRESS = "0x69a0eE537F098C5F84ef5d4c8b4215860F5d5206";

async function main(): Promise<void> {
  console.log("🔧 Fixing Staking Contract Link...\n");
  
  try {
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("═".repeat(50));

    // sbFT Token ABI
    const sbftAbi = [
      "function stakingContract() view returns (address)",
      "function setStakingContract(address _stakingContract)",
      "function owner() view returns (address)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)"
    ];

    // Get sbFT contract instance
    const sbftToken = new ethers.Contract(SBFT_TOKEN_ADDRESS, sbftAbi, deployer);

    console.log("📋 CHECKING CURRENT STATE");
    console.log("═".repeat(50));

    // Check current staking contract
    try {
      const currentStakingContract = await sbftToken.stakingContract();
      console.log("Current staking contract:", currentStakingContract);
      
      if (currentStakingContract === ethers.constants.AddressZero) {
        console.log("❌ No staking contract set!");
      } else if (currentStakingContract.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
        console.log("✅ Staking contract already correctly set!");
        return;
      } else {
        console.log("⚠️  Different staking contract set, updating...");
      }
    } catch (error) {
      console.log("❌ Failed to get current staking contract:", error);
    }

    // Check owner
    try {
      const owner = await sbftToken.owner();
      console.log("sbFT Token Owner:", owner);
      
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("❌ You are not the owner of the sbFT contract!");
        console.log("   Current owner:", owner);
        console.log("   Your address:", deployer.address);
        return;
      }
    } catch (error) {
      console.log("❌ Failed to get owner:", error);
      return;
    }

    // Check total supply
    try {
      const totalSupply = await sbftToken.totalSupply();
      const userBalance = await sbftToken.balanceOf(deployer.address);
      console.log("Total sbFT Supply:", ethers.utils.formatEther(totalSupply));
      console.log("Your sbFT Balance:", ethers.utils.formatEther(userBalance));
    } catch (error) {
      console.log("❌ Failed to get supply info:", error);
    }

    console.log("\n🔗 SETTING STAKING CONTRACT");
    console.log("═".repeat(50));

    // Set staking contract
    try {
      console.log("Setting staking contract to:", STAKING_CONTRACT_ADDRESS);
      const tx = await sbftToken.setStakingContract(STAKING_CONTRACT_ADDRESS);
      console.log("✅ Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      
      // Verify the change
      const newStakingContract = await sbftToken.stakingContract();
      console.log("✅ New staking contract:", newStakingContract);
      
      if (newStakingContract.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase()) {
        console.log("🎉 SUCCESS! Staking contract linked correctly!");
      } else {
        console.log("❌ Something went wrong - addresses don't match");
      }
      
    } catch (error: any) {
      console.log("❌ Failed to set staking contract:", error.message);
      console.log("Full error:", error);
    }

    console.log("\n🧪 TESTING EXCHANGE RATE");
    console.log("═".repeat(50));

    // Test exchange rate after linking
    const stakingAbi = [
      "function getExchangeRate() view returns (uint256)",
      "function totalXFIInPool() view returns (uint256)"
    ];
    
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, deployer);
    
    try {
      const exchangeRate = await stakingContract.getExchangeRate();
      const totalXFI = await stakingContract.totalXFIInPool();
      
      console.log("Exchange Rate:", ethers.utils.formatEther(exchangeRate), "XFI per sbFT");
      console.log("Total XFI in Pool:", ethers.utils.formatEther(totalXFI), "XFI");
      
      if (exchangeRate.gt(0)) {
        console.log("🎉 Exchange rate is now valid!");
      } else {
        console.log("⚠️  Exchange rate is still 0 - this might be expected if no XFI is staked yet");
      }
    } catch (error) {
      console.log("❌ Failed to test exchange rate:", error);
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