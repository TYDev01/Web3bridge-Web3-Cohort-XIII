import {loadFixture}
from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MyToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMyToken() {
    const initialSupply = 500000000;
    const tokenName = "Tony Web3Bridge";
    const tokenSymbol = "TW3B"
    const logoURI = "ipfs://019872d6-f5b0-7fbe-98e9-67590b1ba369";

    // Contracts are deployed using the first signer/account by default
    const [owner,_from, _to] = await hre.ethers.getSigners();

    const MyToken = await hre.ethers.getContractFactory("MyToken");
    const mytoken = await MyToken.deploy(initialSupply, tokenName, tokenSymbol, logoURI);

    return { mytoken, owner, initialSupply, _from, _to };
  }

  describe("Does it meet the functions", function () {
    it("Should check if the token has balance", async function () {
        const { mytoken, owner , initialSupply } = await loadFixture(deployMyToken);

      expect(await mytoken.balanceOf(owner.address)).to.equal(hre.ethers.parseUnits(initialSupply.toString(), 18));
    });
  });

  describe("Transfer", function () {
        it("Should check if token can be transferred", async function () {
            const { mytoken, owner, initialSupply } = await loadFixture(deployMyToken);
            const [, otherAccount] = await hre.ethers.getSigners();
            const transferAmount = hre.ethers.parseUnits("100", 18);
            await mytoken.transfer(otherAccount.address, transferAmount);
            expect(await mytoken.balanceOf(otherAccount.address)).to.equal(transferAmount);

            expect(await mytoken.balanceOf(owner.address))
            .to.equal(hre.ethers.parseUnits(initialSupply.toString(), 18) - transferAmount);
        });
    });

    describe("approve and allowance", function () {
        it("Should approve spender and reflect correct allowance", async function () {
            const { mytoken, owner, _from } = await loadFixture(deployMyToken);
            const amount = 100;

            await mytoken.approve(_from.address, amount);

            expect(await mytoken.allowance(owner.address, _from.address)).to.equal(amount);
        });
    });

    describe("transferFrom", function () {
        it("Should transfer tokens using allowance", async function () {
            const { mytoken, owner, _from, _to } = await loadFixture(deployMyToken);
            const amount = hre.ethers.parseUnits("100", 18);
            const initialSupply = hre.ethers.parseUnits("500000000", 18)

            await mytoken.approve(_from.address, amount);

            await mytoken.connect(_from).transferFrom(owner.address, _to.address, amount);

            expect(await mytoken.balanceOf(owner.address)).to.equal(initialSupply - amount);
            expect(await mytoken.balanceOf(_to.address)).to.equal(amount);

            expect(await mytoken.allowance(owner.address, _from.address)).to.equal(0);
        });
    });

    describe("totalSupply", function () {
        it("Should return the correct total supply", async function () {
            const { mytoken, initialSupply } = await loadFixture(deployMyToken);

            expect(await mytoken.totalSupply()).to.equal(hre.ethers.parseUnits(initialSupply.toString(), 18));
        });
    });






//   describe("Withdrawals", function () {
//     describe("Validations", function () {
//       it("Should revert with the right error if called too soon", async function () {
//         const { lock } = await loadFixture(deployOneYearLockFixture);

//         await expect(lock.withdraw()).to.be.revertedWith(
//           "You can't withdraw yet"
//         );
//       });

//       it("Should revert with the right error if called from another account", async function () {
//         const { lock, unlockTime, otherAccount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // We can increase the time in Hardhat Network
//         await time.increaseTo(unlockTime);

//         // We use lock.connect() to send a transaction from another account
//         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
//           "You aren't the owner"
//         );
//       });

//       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//         const { lock, unlockTime } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // Transactions are sent using the first signer by default
//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).not.to.be.reverted;
//       });
//     });

//     describe("Events", function () {
//       it("Should emit an event on withdrawals", async function () {
//         const { lock, unlockTime, lockedAmount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw())
//           .to.emit(lock, "Withdrawal")
//           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//       });
//     });

//     describe("Transfers", function () {
//       it("Should transfer the funds to the owner", async function () {
//         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).to.changeEtherBalances(
//           [owner, lock],
//           [lockedAmount, -lockedAmount]
//         );
//       });
//     });
//   });
});
