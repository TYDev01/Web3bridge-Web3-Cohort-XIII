// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StudentManagementSystem {
    struct Student {
        string firstname;
        string lastname;
        uint age;
        string house_address;
        address id;
        Status status;
    }

    enum Status {
        ACTIVE,
        DEFERRED,
        RUSTICATED
    }

    Student[] public student;

    modifier User(uint _index){
        require(_index < student.length, "Not found");
        require(student[_index].id == msg.sender, "Not owner");
        _;
    }

    function new_student(string memory _firstname, string memory _lastname, uint _age, string memory _house_address) external {
        address  id = msg.sender;
        student.push(Student(_firstname,_lastname,_age,_house_address, id, Status.ACTIVE));
    }

    function update_student_details(uint _index, string memory _firstname, string memory _lastname, uint _age, string memory _house_address, Status _status) external User(_index) {
        student[_index].firstname = _firstname;
        student[_index].lastname = _lastname;
        student[_index].age = _age;
        student[_index].house_address = _house_address;
        student[_index].status = _status;
    }

    function delete_student(uint _index) external User(_index) {
        delete student[_index];
    }

    function getStudents() external view returns (Student[] memory){
        return student;
    }


}

