import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-deploy";
const config: HardhatUserConfig = {
  solidity: "0.8.26",

  networks: {
    hardhat: {
      // Ethereum mainnet fork
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 20407271
      },
      // Base Sepolia Fork
      /*
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 13713905
      },
     */
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    },
    baseSepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 84532,
      accounts: {
        mnemonic: process.env.MNEMONIC
      },
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org",
          apiKey: process.env.ETHERSCAN
        }
      }
    },
  },
};

export default config;
