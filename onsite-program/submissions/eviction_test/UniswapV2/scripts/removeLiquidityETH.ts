import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    await helpers.impersonateAccount(azaMan);
    await helpers.setBalance(azaMan, ethers.parseEther("100"));
    const signer = await ethers.getSigner(azaMan);

    const erc20 = (addr: string) => ethers.getContractAt("IERC20", addr);
    const USDCc = await erc20(USDC);
    const DAIc = await erc20(DAI);
    const WETHc = await erc20(WETH);
    const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER);

    const factoryAddr = await router.factory();
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddr);
    const pair = await factory.getPair(DAI, WETH);
    const LP = await erc20(pair);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    const usdcToSwap = ethers.parseUnits("2000", 6);
    const usdcBal = await USDCc.balanceOf(signer.address);
    if (usdcBal < usdcToSwap) throw new Error("Not enough USDC on the whale for swap");

    await USDCc.connect(signer).approve(ROUTER, ethers.MaxUint256);
    const swapTx = await router.connect(signer).swapExactTokensForTokens(
        usdcToSwap,
        0,
        [USDC, DAI],
        signer.address,
        deadline
    );
    await swapTx.wait();

    const daiDesired = ethers.parseUnits("1000", 18);
    const ethDesired = ethers.parseEther("0.5");

    await DAIc.connect(signer).approve(ROUTER, ethers.MaxUint256);

    const addTx = await router.connect(signer).addLiquidityETH(
        DAI,
        daiDesired,
        0,
        0,
        signer.address,
        deadline,
        { value: ethDesired }
    );
    const addRcpt = await addTx.wait();
    console.log("addLiquidityETH tx:", addTx.hash);

    const lpAfterAdd = await LP.balanceOf(signer.address);
    if (lpAfterAdd === 0n) throw new Error("LP mint failed");

    await LP.connect(signer).approve(ROUTER, lpAfterAdd);
    const rmTx = await router.connect(signer).removeLiquidityETH(
        DAI,
        lpAfterAdd,
        0,
        0,
        signer.address,
        deadline
    );
    await rmTx.wait();
    console.log("removeLiquidityETH tx:", rmTx.hash);

    const [daiBal, wethBal, lpBal] = await Promise.all([
        DAIc.balanceOf(signer.address),
        WETHc.balanceOf(signer.address),
        LP.balanceOf(signer.address),
    ]);
    const ethBal = await signer.provider.getBalance(signer.address);

    console.log("DAI:", ethers.formatUnits(daiBal, 18));
    console.log("WETH (if any):", ethers.formatUnits(wethBal, 18));
    console.log("ETH:", ethers.formatUnits(ethBal, 18));
    console.log("LP after remove:", lpBal.toString());
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});