// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PiggyBankFactoryModule = buildModule("PiggyBankFactoryModule", (m) => {
  const piggyBankFactory = m.contract("PiggyBankFactory");

  return { piggyBankFactory };
});

export default PiggyBankFactoryModule;




// npx hardhat verify --network lisk-sepolia 0x58C335e54c8F96c28329d26B69Db87a4196cFa42