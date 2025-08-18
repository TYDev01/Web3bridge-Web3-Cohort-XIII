import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(azaMan);
    const signer = await ethers.getSigner(azaMan);

    const USDC = await ethers.getContractAt("IERC20", USDCAddress);
    const DAI = await ethers.getContractAt("IERC20", DAIAddress);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

    const factoryAddr = await ROUTER.factory();
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddr);
    const pairAddress = await factory.getPair(USDCAddress, DAIAddress);
    const LPToken = await ethers.getContractAt("IERC20", pairAddress);
    console.log("USDC-DAI Pair:", pairAddress);

    const usdcBefore = await USDC.balanceOf(signer.address);
    const daiBefore = await DAI.balanceOf(signer.address);
    console.log("USDC Before:", ethers.formatUnits(usdcBefore, 6));
    console.log("DAI Before:", ethers.formatUnits(daiBefore, 18));

    const usdcAmt = ethers.parseUnits("1000", 6);
    const daiAmt = ethers.parseUnits("1000", 18);

    await USDC.connect(signer).approve(UNIRouter, usdcAmt);
    await DAI.connect(signer).approve(UNIRouter, daiAmt);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const addTx = await ROUTER.connect(signer).addLiquidity(
        USDCAddress,
        DAIAddress,
        usdcAmt,
        daiAmt,
        0,
        0,
        signer.address,
        deadline
    );
    await addTx.wait();
    console.log("addLiquidity tx:", addTx.hash);

    const lpBalAfterAdd = await LPToken.balanceOf(signer.address);
    console.log("LP Balance After Add:", lpBalAfterAdd.toString());

    await LPToken.connect(signer).approve(UNIRouter, lpBalAfterAdd);

    const removeTx = await ROUTER.connect(signer).removeLiquidity(
        USDCAddress,
        DAIAddress,
        lpBalAfterAdd,
        0,
        0,
        signer.address,
        deadline
    );
    await removeTx.wait();
    console.log("removeLiquidity tx:", removeTx.hash);

    const usdcAfter = await USDC.balanceOf(signer.address);
    const daiAfter = await DAI.balanceOf(signer.address);
    const lpAfter = await LPToken.balanceOf(signer.address);

    console.log("USDC After:", ethers.formatUnits(usdcAfter, 6));
    console.log("DAI After:", ethers.formatUnits(daiAfter, 18));
    console.log("LP Balance After Remove:", lpAfter.toString());
}

main().catch((err) => {
    console.error(err);
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