import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  console.log("Impersonating account:", azaMan);
  await helpers.impersonateAccount(azaMan);
  const impersonatedSigner = await ethers.getSigner(azaMan);
  console.log("Successfully impersonated. Signer address:", impersonatedSigner.address);

  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);
  console.log("Connected to Uniswap V2 Router at:", UNIRouter);

  const amountOutMin = ethers.parseUnits("90", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Preparing to swap ETH for DAI:");
  console.log("- Minimum amount of DAI expected:", ethers.formatUnits(amountOutMin, 18));
  console.log("- Deadline for swap:", new Date(deadline * 1000).toLocaleString());
  console.log("- Path: [WETH -> DAI]");
  console.log("- ETH to be sent:", ethers.formatEther("1"));

  const tx = await ROUTER.connect(impersonatedSigner).swapExactETHForTokens(
    amountOutMin,
    [wethAddress, DAIAddress],
    impersonatedSigner.address,
    deadline,
    { value: ethers.parseEther("1") }
  );

  console.log("Transaction sent! Waiting for confirmation...");
  await tx.wait();

  console.log("swapExactETHForTokens executed successfully!");
  console.log("Transaction Hash:", tx.hash);
};

main().catch((error) => {
  console.error("Error executing script:", error);
  process.exitCode = 1;
});