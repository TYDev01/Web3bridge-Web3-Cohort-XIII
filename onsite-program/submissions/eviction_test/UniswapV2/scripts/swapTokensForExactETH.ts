import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  console.log("Impersonating account:", azaMan);
  await helpers.impersonateAccount(azaMan);
  const impersonatedSigner = await ethers.getSigner(azaMan);
  console.log("Signer address:", impersonatedSigner.address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);


  const amountOut = ethers.parseUnits("0.003", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  let amountsIn;
  try {
    amountsIn = await ROUTER.getAmountsIn(amountOut, [USDCAddress, wethAddress]);
    const requiredUSDC = amountsIn[0];
    console.log(`To get ${ethers.formatUnits(amountOut, 18)} ETH, you need at least ${ethers.formatUnits(requiredUSDC, 6)} USDC`);
 
    const amountInMax = requiredUSDC * 110n / 100n;
    console.log(`Setting max USDC to spend (with 10% buffer): ${ethers.formatUnits(amountInMax, 6)}`);

    const usdcBalanceBefore = await USDC.balanceOf(impersonatedSigner.address);
    const ethBalanceBefore = await ethers.provider.getBalance(impersonatedSigner.address);

    console.log("USDC Balance before swap:", ethers.formatUnits(usdcBalanceBefore, 6));
    console.log("ETH Balance before swap:", ethers.formatUnits(ethBalanceBefore, 18));

    console.log("Approving Uniswap Router to spend USDC...");
    const approveTx = await USDC.connect(impersonatedSigner).approve(UNIRouter, amountInMax);
    await approveTx.wait();
    console.log("Approval successful!");

    console.log(`Executing swap: USDC -> ETH (Max USDC: ${ethers.formatUnits(amountInMax, 6)}, Target ETH: ${ethers.formatUnits(amountOut, 18)})...`);
    const swapTx = await ROUTER.connect(impersonatedSigner).swapTokensForExactETH(
      amountOut,
      amountInMax,
      [USDCAddress, wethAddress],
      impersonatedSigner.address,
      deadline
    );
    await swapTx.wait();
    console.log("swapTokensForExactETH executed!");

    const usdcBalanceAfter = await USDC.balanceOf(impersonatedSigner.address);
    const ethBalanceAfter = await ethers.provider.getBalance(impersonatedSigner.address);

    console.log("USDC Balance after swap:", ethers.formatUnits(usdcBalanceAfter, 6));
    console.log("ETH Balance after swap:", ethers.formatUnits(ethBalanceAfter, 18));

    console.log("ETH Received:", ethers.formatUnits(ethBalanceAfter - ethBalanceBefore, 18));
    console.log("USDC Spent:", ethers.formatUnits(usdcBalanceBefore - usdcBalanceAfter, 6));
  } catch (error) {
    console.error("Error:", error);
    if (amountsIn) {
      console.log(`Current rate suggests you need ${ethers.formatUnits(amountsIn[0], 6)} USDC for ${ethers.formatUnits(amountOut, 18)} ETH`);
    }
  }
};

main().catch((error) => {
  console.error("Error encountered:", error);
  process.exitCode = 1;
});