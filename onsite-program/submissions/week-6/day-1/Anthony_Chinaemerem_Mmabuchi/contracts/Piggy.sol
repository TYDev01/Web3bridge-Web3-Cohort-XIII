// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";


contract PiggyBank {
    address public owner;
    address public admin;
    uint256 public balance;
    uint256 public lockEnd;
    bool public isETH;
    IERC20 public token;

    constructor(address _owner, address _admin, uint256 _lockPeriod, bool _isETH, address _tokenAddress) {
        owner = _owner;
        admin = _admin;
        lockEnd = block.timestamp + _lockPeriod;
        isETH = _isETH;
        if (!_isETH) {
            token = IERC20(_tokenAddress);
        }
    }

    function deposit(uint256 amount) external payable {
        require(msg.sender == owner, "Only owner can deposit");
        if (isETH) {
            require(msg.value == amount, "Incorrect ETH amount");
            balance += amount;
        } else {
            token.transferFrom(msg.sender, address(this), amount);
            balance += amount;
        }
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(amount <= balance, "Insufficient balance");

        uint256 fee = 0;
        if (block.timestamp < lockEnd) {
            fee = (amount * 3) / 100;
        }

        uint256 amountToSend = amount - fee;

        if (isETH) {
            if (fee > 0) {
                payable(admin).transfer(fee);
            }
            payable(owner).transfer(amountToSend);
        } else {
            if (fee > 0) {
                token.transfer(admin, fee);
            }
            token.transfer(owner, amountToSend);
        }

        balance -= amount;
    }

    function getBalance() external view returns (uint256) {
        require(msg.sender == owner || msg.sender == admin, "Only owner or admin");
        return balance;
    }
}

