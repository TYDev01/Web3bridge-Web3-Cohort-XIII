import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ClockNFTModule", (m) => {
  const clockNFT = m.contract("ClockNFT");

  return { clockNFT };
});


// npx hardhat ignition deploy ./ignition/modules/Deploy.ts --network lisk-sepolia --verify

// npx hardhat ignition deploy --network lisk-sepolia ignition/modules/Deploy.ts
