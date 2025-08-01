// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StudentManagementSystem {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner, "Only admin can perform this action");
        _;
    }

    struct Student {
        string firstname;
        string lastname;
        uint age;
        string house_address;
        address id;
        Status status;
        uint studentId;
        bool exists;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    Student[] public students;
    
    mapping(address => Student) public userToStudent;
    
    mapping(address => bool) public isRegistered;
    
    uint public totalStudents;

    modifier onlyRegisteredStudent() {
        require(isRegistered[msg.sender], "You are not registered as a student");
        _;
    }

    modifier onlyStudentOrAdmin(address _studentAddress) {
        require(
            msg.sender == _studentAddress || msg.sender == owner,
            "Only the student or owner can perform this action"
        );
        _;
    }

    function registerStudent(
        string memory _firstname,
        string memory _lastname,
        uint _age,
        string memory _house_address
    ) external {
        require(!isRegistered[msg.sender], "Student already registered");
        require(_age > 0, "Age must be greater than 0");
        
        uint studentId = totalStudents;
        
        Student memory newStudent = Student({
            firstname: _firstname,
            lastname: _lastname,
            age: _age,
            house_address: _house_address,
            id: msg.sender,
            status: Status.ACTIVE,
            studentId: studentId,
            exists: true
        });
        
        userToStudent[msg.sender] = newStudent;
        
        students.push(newStudent);
        isRegistered[msg.sender] = true;
        totalStudents++;
        
    }

    function updateStudentDetails(
        string memory _firstname,
        string memory _lastname,
        uint _age,
        string memory _house_address
    ) external onlyRegisteredStudent {
        require(_age > 0, "Age must be greater than 0");
        
        Student storage student = userToStudent[msg.sender];
        student.firstname = _firstname;
        student.lastname = _lastname;
        student.age = _age;
        student.house_address = _house_address;
        
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == msg.sender && students[i].exists) {
                students[i] = student;
                break;
            }
        }
    }

    function updateStudentStatus(address _studentAddress, Status _status) external onlyAdmin {
        require(isRegistered[_studentAddress], "Student not found");
        
        userToStudent[_studentAddress].status = _status;
        
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == _studentAddress && students[i].exists) {
                students[i].status = _status;
                break;
            }
        }
    }

    function deleteStudent() external onlyRegisteredStudent {
        
        userToStudent[msg.sender].exists = false;
        isRegistered[msg.sender] = false;
        
        for (uint i = 0; i < students.length; i++) {
            if (students[i].id == msg.sender) {
                students[i].exists = false;
                break;
            }
        }
        
    }

    function getMyProfile() external view onlyRegisteredStudent returns (Student memory) {
        return userToStudent[msg.sender];
    }

    function getStudentProfile(address _studentAddress) external view returns (Student memory) {
        require(isRegistered[_studentAddress], "Student not found");
        return userToStudent[_studentAddress];
    }

    function getAllStudents() external view onlyAdmin returns (Student[] memory) {
        uint activeCount = 0;
        for (uint i = 0; i < students.length; i++) {
            if (students[i].exists) {
                activeCount++;
            }
        }
        
        Student[] memory activeStudents = new Student[](activeCount);
        uint index = 0;
        
        for (uint i = 0; i < students.length; i++) {
            if (students[i].exists) {
                activeStudents[index] = students[i];
                index++;
            }
        }
        
        return activeStudents;
    }

    function getStudentsByStatus(Status _status) external view onlyAdmin returns (Student[] memory) {
        uint count = 0;
        for (uint i = 0; i < students.length; i++) {
            if (students[i].exists && students[i].status == _status) {
                count++;
            }
        }
        
        Student[] memory filteredStudents = new Student[](count);
        uint index = 0;
        
        for (uint i = 0; i < students.length; i++) {
            if (students[i].exists && students[i].status == _status) {
                filteredStudents[index] = students[i];
                index++;
            }
        }
        
        return filteredStudents;
    }

    function getTotalActiveStudents() external view returns (uint) {
        uint count = 0;
        for (uint i = 0; i < students.length; i++) {
            if (students[i].exists) {
                count++;
            }
        }
        return count;
    }
}