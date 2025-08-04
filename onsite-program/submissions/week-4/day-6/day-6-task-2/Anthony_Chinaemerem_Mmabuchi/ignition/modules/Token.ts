// ignition/modules/MyToken.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MyTokenModule = buildModule("MyTokenModule", (m) => {
  // Token configuration parameters
  const initialSupply = m.getParameter("initialSupply", 500000000);
  const tokenName = m.getParameter("name", "Tony Web3Bridge");
  const tokenSymbol = m.getParameter("symbol", "TW3B");
  const logoURI = m.getParameter("logoURI", "ipfs://019872d6-f5b0-7fbe-98e9-67590b1ba369");

  // Deploy the MyToken contract
  const myToken = m.contract("MyToken", [
    initialSupply,
    tokenName, 
    tokenSymbol,
    logoURI
  ]);

  return { myToken };
});

export default MyTokenModule;