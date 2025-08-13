import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
    // 'lisk-sepolia': {
    //   type: "http",
    //   chainType: "l1",
    //   url: "https://rpc.sepolia-api.lisk.com",
    //   accounts: [configVariable("WALLET_KEY")],
    //   gasPrice: 1000000000,
    // },
    // 'lisk-sepolia': {
    //   url: 'https://rpc.sepolia-api.lisk.com',
    //   accounts: [WALLET_KEY as string],
    //   gasPrice: 1000000000,
    // },
  },
};

export default config;
