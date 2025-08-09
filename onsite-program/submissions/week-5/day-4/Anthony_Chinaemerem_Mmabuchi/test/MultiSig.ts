import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import type { MultiSig } from "../typechain-types";

describe("MultiSig", function () {
  async function deployMultiSigFixture() {
    const [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();
    
    const owners = [
      await owner1.getAddress(),
      await owner2.getAddress(),
      await owner3.getAddress()
    ];
    const required = 2;

    const MultiSigFactory = await ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSigFactory.deploy(owners, required) as MultiSig;

    return { multiSig, owners, required, owner1, owner2, owner3, nonOwner };
  }

  describe("Transaction Flow", function () {
    it("Should complete full transaction flow", async function () {
      const { multiSig, owner1, owner2, nonOwner } = await loadFixture(deployMultiSigFixture);
      
      // Submit transaction
      const tx = await multiSig.connect(owner1).submit(
        await nonOwner.getAddress(),
        ethers.parseEther("1"),
        "0x"
      );
      
      await expect(tx)
        .to.emit(multiSig, "Submit")
        .withArgs(0);
      
      // Approve by two owners
      await expect(multiSig.connect(owner1).approve(0))
        .to.emit(multiSig, "Approve")
        .withArgs(owner1.address, 0);
      
      await expect(multiSig.connect(owner2).approve(0))
        .to.emit(multiSig, "Approve")
        .withArgs(owner2.address, 0);
      
      // Execute
      await expect(multiSig.connect(owner1).execute(0))
        .to.emit(multiSig, "Execute")
        .withArgs(0);
    });
  });
});