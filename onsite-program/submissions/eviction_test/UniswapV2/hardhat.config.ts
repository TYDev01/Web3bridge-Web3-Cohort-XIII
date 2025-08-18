import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
  networks: {
  hardhat: {
    forking: {
      url: "https://eth-mainnet.g.alchemy.com/v2/oLRk5BSi2IETg8VuVpfdP",
    }
  }
}
};

export default config;


// npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/oLRk5BSi2IETg8VuVpfdP
// npx hardhat run scripts/removeLiquidity.ts --network hardhat
