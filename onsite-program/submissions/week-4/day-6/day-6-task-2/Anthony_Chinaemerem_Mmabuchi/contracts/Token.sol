// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20.sol";
contract MyToken is IERC20 {
    mapping(address => uint) public _balances;
    mapping(address => mapping(address => uint256)) public _allowances;


    uint256 public _totalSupply;
    string public name;
    string public symbol;
    string public logoURI;

    constructor(uint _initialSupply, string memory _name, string memory _symbol,string memory _logoURI){
        name = _name;
        symbol = _symbol;
        _totalSupply = _initialSupply * 10**18;
        _balances[msg.sender] = _totalSupply;
        logoURI = _logoURI;
    }

    function balanceOf(address _owner) external override view returns (uint){
        return _balances[_owner];
    }

    function transfer(address _to, uint _amount) external override returns (bool success){
        require(_to != address(0), "Invalid address");
        require(_amount <= _balances[msg.sender], "insufficient balance");
        _balances[msg.sender] -= _amount;
        _balances[_to] += _amount;
        return true;
    }

    function transferFrom(address _from, address _to, uint _amount) external returns (bool) {
        require(_to != address(0), "Invalid address");
        require(_amount <= _balances[_from], "Insufficient balance");
        require(_amount <= _allowances[_from][msg.sender], "Insufficient allowance");
        
        _balances[_from] -= _amount;
        _balances[_to] += _amount;
        _allowances[_from][msg.sender] -= _amount;
        
        return true;
    }


    function approve(address _spender,uint _value) external override returns (bool){
        _allowances[msg.sender][_spender] = _value;
        return true;
    }

    function totalSupply() external view returns (uint){
        return _totalSupply;
    }

    function allowance(address _owner, address _spender) external view returns (uint256){
        return _allowances[_owner][_spender];
    }

}


