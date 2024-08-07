import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
const config: HardhatUserConfig = {
  solidity: "0.8.26",

  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_RPC_URL,
        blockNumber: 20407271
      },
      accounts: {
        mnemonic: process.env.MNEMONIC
      }
    }
  }
};

export default config;
