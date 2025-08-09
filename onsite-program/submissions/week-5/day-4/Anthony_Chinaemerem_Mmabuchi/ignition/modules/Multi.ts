// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiSigModule = buildModule("MultiSigModule", (m) => {
  const owners = m.getParameter(
    "owners",
    [
      "0x0df29A31f55A95CA0Ac76869a4AA92167D8b3aCd", // Hardhat account 0
      "0x3884fabFd86E85074a2d24bFf0C9A99B5D688515", // Hardhat account 1
      "0x22BB859ED95c9c4FF558B56Ae0F2801859423fC5"  // Hardhat account 2
    ]
  );

  const required = m.getParameter("required", 2);

  const multiSig = m.contract("MultiSig", [owners, required]);

  return { multiSig };
});

export default MultiSigModule;



