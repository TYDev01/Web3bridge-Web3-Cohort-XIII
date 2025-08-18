import {ethers} from "hardhat"

const helpers = require('@nomicfoundation/hardhat-toolbox/network-helpers');


async function main(){
    const walletToImpersonate = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
    
    const Router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});















// function addLiquidityETH(
//         address token,
//         uint amountTokenDesired,
//         uint amountTokenMin,
//         uint amountETHMin,
//         address to,
//         uint deadline
//     ) external payable returns (uint amountToken, uint amountETH, uint liquidity);