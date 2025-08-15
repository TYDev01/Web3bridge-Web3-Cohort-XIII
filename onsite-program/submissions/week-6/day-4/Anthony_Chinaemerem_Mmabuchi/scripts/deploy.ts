import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({
    network: "hardhatOp",
    chainType: "op",
  });


  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);

  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const subscriptionId = ethers.formatUnits("98736701378912444037740806390947872933267506767238031969957689228656853961000");
  const keyHash = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
  const openFee = ethers.parseEther("0.01");
  const openStartTimestamp = Math.floor(Date.now() / 1000);

  console.log("Deploying LootBox contract");
  const LootBoxFactory = await ethers.getContractFactory("LootBox", deployer);
  const lootBox = await LootBoxFactory.deploy(
    vrfCoordinator,
    subscriptionId,
    keyHash,
    openFee,
    openStartTimestamp
  );

  console.log("Sending deployment transaction");
  await lootBox.waitForDeployment();
  const contractAddress = await lootBox.getAddress();
  console.log("LootBox deployed to:", contractAddress);
  console.log("Deployment transaction sent successfully");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});