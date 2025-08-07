// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Token.sol";

contract TokenFactory {
    MyToken[] public deployeTokens;
    address private owner;

    constructor(){
        owner = msg.sender;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function createNewToken(uint _initialSupply, string memory _name, string memory _symbol,string memory _logoURI) external onlyOwner {
        MyToken new_Token_ = new  MyToken(_initialSupply, _name, _symbol, _logoURI);
        deployeTokens.push(new_Token_);
    }

    function getDeployedToken() external view returns (MyToken[] memory) {
        return deployeTokens;
    }
}