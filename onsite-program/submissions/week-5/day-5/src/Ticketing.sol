// pragma solidity ^0.8.13;

// import "./ERC20.sol";

// contract Ticket {
//     struct Tickets{
//         string ticketName;
//         uint ticketAmount;
//         uint ticketId;
//         uint256 totalSupply;
//         uint256 sold;
//         bool active;
//     }

//     Tickets[] public allTickets;
//     address private owner;
//     string public eventName;
//     uint newticketID = 1;


//     constructor(){
//         owner = msg.sender;
//     }

//     modifier onlyOwner(){
//         require(owner == msg.sender, "Not owner");
//         _;
//     }


//     function createTicket(string memory _ticketName, uint _ticketAmount, uint _totalSupply) external onlyOwner{
//         allTickets.push(Tickets({ticketName: _ticketName, ticketAmount: _ticketAmount, ticketId: newticketID, totalSupply: _totalSupply, sold: 0, active: true}));
//         // Ticket[] memory new_Ticket_ = Ticket({name: _ticketName, ticketAmount: _ticketAmount, ticketId: newTicketId});
//         // tickets.push(new_Ticket_);
//         newTicketID++;
//     }

//     function buyTicket()
// }
