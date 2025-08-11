// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Piggy.sol";

contract PiggyBankFactory {
    address public admin;
    mapping(address => address[]) public userSavings;
    mapping(address => uint256) public userAccountCount;

    constructor() {
        admin = msg.sender;
    }

    function createPiggyBank(uint256 lockPeriod, bool isETH, address tokenAddress) external {
        PiggyBank newBank;
        if (isETH) {
            newBank = new PiggyBank(msg.sender, admin, lockPeriod, true, address(0));
        } else {
            require(tokenAddress != address(0), "Invalid token address");
            newBank = new PiggyBank(msg.sender, admin, lockPeriod, false, tokenAddress);
        }
        userSavings[msg.sender].push(address(newBank));
        userAccountCount[msg.sender]++;
    }

    function getUserSavings(address user) external view returns (address[] memory) {
        return userSavings[user];
    }

    function getUserAccountCount(address user) external view returns (uint256) {
        return userAccountCount[user];
    }

    function getPiggyBankBalance(address piggyBankAddress) external view returns (uint256) {
        PiggyBank bank = PiggyBank(piggyBankAddress);
        return bank.getBalance();
    }
}