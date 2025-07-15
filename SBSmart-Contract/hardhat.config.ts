import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      gas: 30000000,
      gasPrice: 0,
      allowUnlimitedContractSize: true,
      accounts: {
        count: 20, // Increase account count for testing
        accountsBalance: "1000000000000000000000000" // 1M ETH per account
      }
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  }
};

export default config;