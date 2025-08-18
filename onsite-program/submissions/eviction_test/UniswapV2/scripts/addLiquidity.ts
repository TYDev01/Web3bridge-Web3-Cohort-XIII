import { ethers } from "hardhat";
import { text } from "stream/consumers";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  // Impersonate the USDC Holder
  await helpers.impersonateAccount(azaMan);
  const impersonatedSigner = await ethers.getSigner(azaMan);

  const amountADesired = ethers.parseUnits("20000", 6); // 20,000 USDC
  const amountBDesired = ethers.parseUnits("20000", 18); // 20,000 DAI

  // Fetch Contract Instances
  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Approving tokens for Uniswap Router...");

  // Approve USDC
  let approveTx = await USDC.connect(impersonatedSigner).approve( UNIRouter, amountADesired);
  await approveTx.wait();

  // Approve DAI
  approveTx = await DAI.connect(impersonatedSigner).approve( UNIRouter, amountBDesired);
  await approveTx.wait();

  console.log("Token approvals successful at:", approveTx.hash);

  // Check Balances Before Adding Liquidity
  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

  // Define Deadline
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Adding liquidity to Uniswap...");

  // Add Liquidity
  const addLiquidityTx = await ROUTER.connect(impersonatedSigner).addLiquidity(
    USDCAddress,
    DAIAddress,
    amountADesired,
    amountBDesired,
    0, // Min USDC Amount
    0, // Min DAI Amount
    impersonatedSigner.address,
    deadline
  );

  await addLiquidityTx.wait();

  console.log("Liquidity successfully added at:", addLiquidityTx.hash);

  // Check Balances After Adding Liquidity
  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18));

  // Fetch LP Token Address
  const FACTORY = await ethers.getContractAt(
    "IUniswapV2Factory",
    await ROUTER.factory()
  );

  const pairAddress = await FACTORY.getPair(USDCAddress, DAIAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  const lpBalance = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("LP Token Balance:", ethers.formatUnits(lpBalance, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});