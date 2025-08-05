import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
import { EmployeeManagement } from "../typechain-types";
import { expect } from "chai"

describe("EmployeeManagement", function () {
  let employeeManagement: EmployeeManagement;
  let owner: any;
  let employee1: any;
  let employee2: any;

  beforeEach(async function () {
    [owner, employee1, employee2] = await hre.ethers.getSigners();

    const EmployeeManagementFactory = await hre.ethers.getContractFactory("EmployeeManagement");
    employeeManagement = (await EmployeeManagementFactory.deploy()) as EmployeeManagement;
    await employeeManagement.waitForDeployment();
  });

  it("should register a new employee", async function () {
    await expect(
      employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0)
    )
      .to.emit(employeeManagement, "EmployeeRegistered")
      .withArgs(employee1.address, "John Doe", 0, hre.ethers.parseEther("1"));

    expect(await employeeManagement.checkEmployeeRegistration(employee1.address)).to.be.true;
    expect(await employeeManagement.getEmployeeCount()).to.equal(1);
  });

  it("should not allow duplicate employee registration", async function () {
    await employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0);
    await expect(
      employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0)
    ).to.be.revertedWithCustomError(employeeManagement, "EmployeeAlreadyRegistered");
  });

  it("should update employee status", async function () {
    await employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0);
    await expect(employeeManagement.updateEmployeeStatus(employee1.address, 1))
      .to.emit(employeeManagement, "EmployeeStatusChanged")
      .withArgs(employee1.address, 0, 1);
  });

  it("should disburse salary to active employee", async function () {
    await employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0);
    await employeeManagement.fundContract({ value: hre.ethers.parseEther("5") });

    await expect(
      employeeManagement.disburseSalary(employee1.address, hre.ethers.parseEther("1"))
    )
      .to.emit(employeeManagement, "SalaryDisbursed")
      .withArgs(employee1.address, hre.ethers.parseEther("1"), anyValue);

    const balance = await hre.ethers.provider.getBalance(employee1.address);
    expect(balance).to.be.gt(0);
  });

  it("should fail if amount exceeds agreed salary", async function () {
    await employeeManagement.registerEmployee(employee1.address, "John Doe", hre.ethers.parseEther("1"), 0);
    await employeeManagement.fundContract({ value: hre.ethers.parseEther("5") });

    await expect(
      employeeManagement.disburseSalary(employee1.address, hre.ethers.parseEther("2"))
    ).to.be.revertedWithCustomError(employeeManagement, "AmountExceedsAgreedSalary");
  });

  it("should fund contract and get balance", async function () {
    await employeeManagement.fundContract({ value: hre.ethers.parseEther("3") });
    const balance = await employeeManagement.getContractBalance();
    expect(balance).to.equal(hre.ethers.parseEther("3"));
  });
});
