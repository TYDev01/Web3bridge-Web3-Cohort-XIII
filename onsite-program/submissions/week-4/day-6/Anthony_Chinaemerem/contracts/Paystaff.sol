// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmployeePayment {
    function disburseSalary(address payable _employee, uint256 _amount) external payable;
    function getEmployeeDetails(address _employee) external view returns (string memory name, uint256 salary, uint8 role, uint8 status);
}

error EmployeeNotFound(address employee);
error EmployeeNotActive(address employee);
error AmountExceedsAgreedSalary(uint256 amount, uint256 agreedSalary);
error InsufficientContractBalance(uint256 required, uint256 available);
error EmployeeAlreadyRegistered(address employee);

contract EmployeeManagement is IEmployeePayment {

    struct Employee {
        string name;
        uint256 salary;
        Role role;
        Status status;
        uint256 registrationDate;
    }

    enum Role { MENTOR, ADMIN, SECURITY }
    enum Status { ACTIVE, PROBATION, TERMINATED }


    Employee[] public employees;
    mapping(address => Employee) public employeeDetails;
    mapping(address => uint256) public employeeIndex;
    mapping(address => bool) public isRegistered;
    
    address public owner;
    uint256 public totalEmployees;


    event EmployeeRegistered(address indexed employee, string name, Role role, uint256 salary);
    event SalaryDisbursed(address indexed employee, uint256 amount, uint256 timestamp);
    event EmployeeStatusChanged(address indexed employee, Status oldStatus, Status newStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier employeeExists(address _employee) {
        if (!isRegistered[_employee]) {
            revert EmployeeNotFound(_employee);
        }
        _;
    }

    modifier employeeActive(address _employee) {
        if (employeeDetails[_employee].status != Status.ACTIVE) {
            revert EmployeeNotActive(_employee);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }


    function registerEmployee(
        address _employee,
        string memory _name,
        uint256 _salary,
        Role _role
    ) external onlyOwner {
        if (isRegistered[_employee]) {
            revert EmployeeAlreadyRegistered(_employee);
        }

        Employee memory newEmployee = Employee({
            name: _name,
            salary: _salary,
            role: _role,
            status: Status.ACTIVE,
            registrationDate: block.timestamp
        });

        employees.push(newEmployee);
        employeeDetails[_employee] = newEmployee;
        employeeIndex[_employee] = totalEmployees;
        isRegistered[_employee] = true;
        totalEmployees++;

        emit EmployeeRegistered(_employee, _name, _role, _salary);
    }


    function updateEmployeeStatus(address _employee, Status _newStatus) 
        external 
        onlyOwner 
        employeeExists(_employee) 
    {
        Status oldStatus = employeeDetails[_employee].status;
        employeeDetails[_employee].status = _newStatus;
        employees[employeeIndex[_employee]].status = _newStatus;

        emit EmployeeStatusChanged(_employee, oldStatus, _newStatus);
    }


    function disburseSalary(address payable _employee, uint256 _amount) 
        external 
        payable 
        override
        employeeExists(_employee)
        employeeActive(_employee)
    {
        Employee memory emp = employeeDetails[_employee];
        
        if (_amount > emp.salary) {
            revert AmountExceedsAgreedSalary(_amount, emp.salary);
        }

        if (address(this).balance < _amount) {
            revert InsufficientContractBalance(_amount, address(this).balance);
        }

        _employee.transfer(_amount);
        emit SalaryDisbursed(_employee, _amount, block.timestamp);
    }

    function getEmployeeDetails(address _employee) 
        external 
        view 
        override
        employeeExists(_employee)
        returns (string memory name, uint256 salary, uint8 role, uint8 status) 
    {
        Employee memory emp = employeeDetails[_employee];
        return (emp.name, emp.salary, uint8(emp.role), uint8(emp.status));
    }

    function getAllEmployees() external view returns (Employee[] memory) {
        return employees;
    }


    function getEmployeesByRole(Role _role) external view returns (Employee[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].role == _role) {
                count++;
            }
        }

        Employee[] memory roleEmployees = new Employee[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].role == _role) {
                roleEmployees[index] = employees[i];
                index++;
            }
        }

        return roleEmployees;
    }


    function getEmployeesByStatus(Status _status) external view returns (Employee[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].status == _status) {
                count++;
            }
        }

        Employee[] memory statusEmployees = new Employee[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].status == _status) {
                statusEmployees[index] = employees[i];
                index++;
            }
        }

        return statusEmployees;
    }

    function getActiveEmployeesCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].status == Status.ACTIVE) {
                count++;
            }
        }
        return count;
    }

    function fundContract() external payable onlyOwner {}

    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function checkEmployeeRegistration(address _employee) external view returns (bool) {
        return isRegistered[_employee];
    }

    function getEmployeeCount() external view returns (uint256) {
        return totalEmployees;
    }

    receive() external payable {}
    fallback() external payable {}
}