import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");


async function main() {
  const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const uniswapRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const owner = (await ethers.getSigners())[0];
  const spender = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const amount = ethers.parseUnits("100", 18);
  const deadline = Math.floor(Date.now() / 1000) + 20 * 60;

  const token = await ethers.getContractAt("IERC20Permit", tokenAddress);


  const domain = {
    name: "Dai Stablecoin",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: tokenAddress,
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


  const nonce = await token.nonces(owner.address);

  const message = {
    owner: owner.address,
    spender: spender,
    value: amount,
    nonce: nonce,
    deadline: deadline,
  };


  const signature = await owner.signTypedData(domain, types, message);
  const { v, r, s } = ethers.Signature.from(signature);

  console.log("Signature:", { v, r, s });
  console.log("Permit Data:", {
    tokenIn: tokenAddress,
    amountIn: amount.toString(),
    amountOutMin: 0,
    path: [tokenAddress, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
    to: owner.address,
    deadline,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});