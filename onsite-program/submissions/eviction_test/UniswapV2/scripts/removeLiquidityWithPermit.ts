import { Signature } from "ethers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  console.log("Impersonating account:", azaMan);
  await helpers.impersonateAccount(azaMan);
  const impersonatedSigner = await ethers.getSigner(azaMan);
  console.log("Signer address:", impersonatedSigner.address);

  const USDC = await ethers.getContractAt("IERC20", USDCAddress);
  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Getting Pair Address for Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(USDCAddress, DAIAddress);
  console.log("Pair Address:", pairAddress);

  const LPToken = await ethers.getContractAt("IERC20Permit", pairAddress);

  const liquidity = await LPToken.balanceOf(impersonatedSigner.address);
  console.log("Liquidity to remove:", ethers.formatUnits(liquidity, 18));

  const amountOutMin = ethers.parseUnits("0", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  const nonce = await LPToken.nonces(impersonatedSigner.address);
  console.log("Nonce for permit:", nonce.toString());

  const permit = {
    owner: impersonatedSigner.address,
    spender: UNIRouter,
    value: liquidity,
    nonce: nonce,
    deadline: deadline,
  };

  const domain = {
    name: "Uniswap V2",
    version: "1",
    chainId: 1,
    verifyingContract: pairAddress,
  };


  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };


  console.log("Signing permit message...");
  const signature = await impersonatedSigner.signTypedData(domain, types, permit);
  const { v, r, s } = Signature.from(signature);

  console.log("Calling removeLiquidityWithPermit...");

  const tx = await ROUTER.connect(impersonatedSigner).removeLiquidityWithPermit(
    USDCAddress,
    DAIAddress,
    liquidity,
    amountOutMin,
    amountOutMin,
    impersonatedSigner.address,
    deadline,
    true,
    v,
    r,
    s
  );

  console.log("Transaction sent, waiting for confirmation...");
  await tx.wait();

  console.log("removeLiquidityWithPermit executed!");
};

main().catch((error) => {
  console.error("Error encountered:", error);
  process.exitCode = 1;
});