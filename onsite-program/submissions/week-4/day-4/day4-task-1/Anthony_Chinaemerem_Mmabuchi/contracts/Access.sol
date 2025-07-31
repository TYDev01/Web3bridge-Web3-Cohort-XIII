// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Access {
    enum Role { MEDIA_TEAM, MENTORS, MANAGERS, SOCIAL_MEDIA_TEAM, TECHNICAL_SUPERVISORS, KITCHEN_STAFF }


    struct Employee {
        string name;
        Role role;
        bool isTerminated;
    }
    Employee[] public employee;

    mapping(address => Employee[]) userId;

    function addEmployee(string memory _name) external {
        employee.push(Employee(_name, Role.MEDIA_TEAM, false));
    }

    function updateEmployee(address _address, uint256 _index,string memory _newName,Role _newRole,bool _isTerminated) external {
        require(userId[_address].length > 0, "User not found");
        require(_index < userId[_address].length, "Employee index out of bounds");
        
        userId[_address][_index].name = _newName;
        userId[_address][_index].role = _newRole;
        userId[_address][_index].isTerminated = _isTerminated;
    }

    function hasAccess(Role _role) external pure returns (string memory) {
        require(_role != Role.SOCIAL_MEDIA_TEAM && _role != Role.TECHNICAL_SUPERVISORS && _role != Role.KITCHEN_STAFF, "Access Denied");
        return "You have access";
    }

    function getAll() external view returns (Employee[] memory){
        return employee;
    }

    function getUserById(address _address) external view returns (Employee[] memory) {
        return userId[_address];
    }


}


