import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const SwapModule = buildModule("SwapModule", (m) => {
  const uniswapRouter = m.getParameter("uniswapRouter", UNISWAP_V2_ROUTER);

  const swap = m.contract("Swap", [uniswapRouter]);

  return { swap };
});

export default SwapModule;