// test/PiggyBankFactory.test.ts

import { expect } from "chai";
import { ethers } from "hardhat";

describe("PiggyBankFactory Simple Test", function () {
  it("should deploy factory and create a piggy bank", async function () {
    // Get the contract factory
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");

    // Deploy the factory (no need for .deployed())
    const factory = await PiggyBankFactory.deploy();

    // Get the signer (user)
    const [user] = await ethers.getSigners();

    // Create a piggy bank for ETH with 30 days lock
    const lockPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
    await factory.createPiggyBank(lockPeriod, true, ethers.ZeroAddress);

    // Check user's savings list
    const userSavings = await factory.getUserSavings(user.address);
    expect(userSavings.length).to.equal(1);

    // Check account count
    const accountCount = await factory.getUserAccountCount(user.address);
    expect(accountCount).to.equal(1);

    // Get the piggy bank address
    const piggyBankAddress = userSavings[0];

    // Connect to the piggy bank contract
    const PiggyBank = await ethers.getContractFactory("PiggyBank");
    const piggyBank = PiggyBank.attach(piggyBankAddress);

    // Check initial balance is 0
    const balance = await piggyBank.getBalance();
    expect(balance).to.equal(0);

    // Deposit 1 ETH
    const depositAmount = ethers.parseEther("1");
    await piggyBank.deposit(depositAmount, { value: depositAmount });

    // Check balance after deposit
    const newBalance = await piggyBank.getBalance();
    expect(newBalance).to.equal(depositAmount);
  });
});