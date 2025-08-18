import { Signature } from "ethers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const azaMan = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(azaMan);
  const impersonatedSigner = await ethers.getSigner(azaMan);

  const DAI = await ethers.getContractAt("IERC20Permit", DAIAddress);
  const WETH = await ethers.getContractAt("IERC20", wethAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  console.log("Getting Pair Address for Uniswap Router...");
  const factoryAddress = await ROUTER.factory();
  const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  const pairAddress = await factory.getPair(DAIAddress, wethAddress);
  const LPToken = await ethers.getContractAt("IERC20", pairAddress);

  console.log("Getting Token Balance...");
  // Balance before adding liquidity
  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
 
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

  const liquidityBF = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("Liquidity Token Balance BF Burn:", liquidityBF);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Get the chainId from the provider
  const network = await impersonatedSigner.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Connected to chain with ID:", chainId);

  // Generate the Permit Signature
  const nonce = await DAI.nonces(impersonatedSigner.address); // Get the current nonce
  const permitData = {
    owner: impersonatedSigner.address,
    spender: UNIRouter,
    value: liquidityBF, 
    nonce: nonce,
    deadline: deadline,
  };

  const domain = {
    name: "Dai Stablecoin",
    version: "1",
    chainId: chainId,
    verifyingContract: DAIAddress,
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

  // EIP-712 Structured Data
  const message = {
    owner: permitData.owner,
    spender: permitData.spender,
    value: permitData.value,
    nonce: permitData.nonce,
    deadline: permitData.deadline,
  };

  const signature = await impersonatedSigner.signTypedData(domain, types, message);

  // Split the signature into v, r, s
  const { v, r, s } = await Signature.from(signature);

  const tx = await ROUTER.connect(impersonatedSigner).removeLiquidityETHWithPermit(
    DAIAddress,
    liquidityBF,
    0,
    0,
    impersonatedSigner.address,
    deadline,
    true,
    v,
    r,
    s
  );
  await tx.wait();

  console.log("removeLiquidityETHWithPermit executed at", tx.hash);
  
   // Balance after adding liquidity
   const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
   const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
 
   console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
   console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));

  const liquidityAF = await LPToken.balanceOf(impersonatedSigner.address);

  console.log("Liquidity Token Balance AF Burn:", liquidityAF);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});