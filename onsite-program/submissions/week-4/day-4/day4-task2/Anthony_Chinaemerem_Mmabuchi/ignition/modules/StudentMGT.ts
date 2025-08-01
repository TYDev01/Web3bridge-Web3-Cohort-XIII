// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StudentManagementModule = buildModule("StudentManagementModule", (m) => {
  // Deploy the StudentManagementSystem contract
  // No constructor parameters needed as admin is set to msg.sender
  const studentManagement = m.contract("StudentManagementSystem", []);

  return {
    studentManagement,
  };
});

export default StudentManagementModule;