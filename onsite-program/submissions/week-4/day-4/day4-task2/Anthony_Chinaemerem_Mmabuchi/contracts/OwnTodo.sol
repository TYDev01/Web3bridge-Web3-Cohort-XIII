// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract TodoList {
    address public owner;

    constructor(){
        owner = msg.sender;
    }

    modifier onlyOwner(){
        require(owner == msg.sender, "You're not the owner");
        _;
    }

    struct Todo {
        string title;
        string description;
        bool completed;
        uint timestamp;
        uint id;
    }

    Todo[] public todos;
    
    mapping(address => Todo[]) public userTodos;
    mapping(address => uint) public userTodoCount;

    function createTask(string memory _title, string memory _description) external {
        uint todoId = userTodoCount[msg.sender];
        
        Todo memory newTodo = Todo({title: _title, description: _description, completed: false, timestamp: block.timestamp, id: todoId});
        
 
        userTodos[msg.sender].push(newTodo);
        
        todos.push(newTodo);

        userTodoCount[msg.sender]++;
    }

    function getUserTodos(address _user) external view returns (Todo[] memory) {
        return userTodos[_user];
    }

    function getMyTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }

    function completeTodo(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Todo not found");
        require(!userTodos[msg.sender][_index].completed, "Todo already completed");
        
        userTodos[msg.sender][_index].completed = true;
    }

    function deleteTodo(uint _index) external {
        require(_index < userTodos[msg.sender].length, "Todo not found");
        
        for (uint i = _index; i < userTodos[msg.sender].length - 1; i++) {
            userTodos[msg.sender][i] = userTodos[msg.sender][i + 1];
        }
        userTodos[msg.sender].pop();
    }

    function getAllTasks() external view onlyOwner returns (Todo[] memory) {
        return todos;
    }

    function getUserTodoCount(address _user) external view returns (uint) {
        return userTodos[_user].length;
    }
}
    // Create a todolist that only the id can interact with it, that's can perform changes to the Todolist
