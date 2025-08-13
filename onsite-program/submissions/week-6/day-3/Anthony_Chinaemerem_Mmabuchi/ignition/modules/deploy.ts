import { ethers } from "hardhat";

async function main() {
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy();
  await nft.waitForDeployment();
  console.log(`MyNFT deployed to: ${await nft.getAddress()}`);

  const RolesRegistry = await ethers.getContractFactory("RolesRegistry");
  const registry = await RolesRegistry.deploy();
  await registry.waitForDeployment();
  console.log(`RolesRegistry deployed to: ${await registry.getAddress()}`);

  const Dao = await ethers.getContractFactory("Dao");
  const dao = await Dao.deploy(await nft.getAddress(), await registry.getAddress());
  await dao.waitForDeployment();
  console.log(`Dao deployed to: ${await dao.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});