import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDC_Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAI_Address = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const AzaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(AzaMan);
  const impersonatedSigner = await ethers.getSigner(AzaMan);

  const USDC = await ethers.getContractAt("IERC20", USDC_Address);
  const DAI = await ethers.getContractAt("IERC20", DAI_Address);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Getting Pair Address for Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);


  console.log("Getting Pair Address for Uniswap Router...");

  const pair_Addr = await factory.getPair(USDC_Address, DAI_Address);
  const Liquidity_Tokens = await ethers.getContractAt("IERC20", pair_Addr);


  const usdcBalBefore = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalBefore = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance Before:", ethers.formatUnits(usdcBalBefore, 6));
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalBefore, 18));

  const liquidityBF = await Liquidity_Tokens.balanceOf(impersonatedSigner.address);
  console.log("Liquidity Token Balance BF Burn:", liquidityBF);

  console.log("Approving LP tokens to be burnt");

  await Liquidity_Tokens.connect(impersonatedSigner).approve(UNIRouter, liquidityBF);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  console.log("Removing Liquidity . . . .");
  const tx = await ROUTER.connect(impersonatedSigner).removeLiquidity(
    USDC_Address,
    DAI_Address,
    liquidityBF,
    0,
    0,
    impersonatedSigner.address,
    deadline
  );
  await tx.wait();

  console.log("removeLiquidity executed at:", tx.hash);

  // Check Balances After Adding Liquidity
  const usdcBalAfter = await USDC.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await DAI.balanceOf(impersonatedSigner.address);

  console.log("USDC Balance After:", ethers.formatUnits(usdcBalAfter, 6));
  console.log("DAI Balance After:", ethers.formatUnits(daiBalAfter, 18));

  const liquidityAF = await Liquidity_Tokens.balanceOf(impersonatedSigner.address);

  console.log("Liquidity Token Balance AF Burn:", liquidityAF);

};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



//     // function removeLiquidity(
//     //     address tokenA,
//     //     address tokenB,
//     //     uint liquidity,
//     //     uint amountAMin,
//     //     uint amountBMin,
//     //     address to,
//     //     uint deadline
//     // ) external returns (uint amountA, uint amountB);

// main().catch((e)=>{
//     console.error(e);
//     process.exit(1)
// })