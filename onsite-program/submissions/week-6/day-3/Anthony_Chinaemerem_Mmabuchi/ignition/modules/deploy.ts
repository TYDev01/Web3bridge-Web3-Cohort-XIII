import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DaoModule", (m) => {
  const myNFT = m.contract("MyNFT");

  const rolesRegistry = m.contract("RolesRegistry");

  const dao = m.contract("Dao", [myNFT, rolesRegistry]);

  return { myNFT, rolesRegistry, dao };
});
