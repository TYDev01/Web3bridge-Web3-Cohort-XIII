// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventToken is ERC20, Ownable {
    constructor() ERC20("EventToken", "EVT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract TicketNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    struct EventInfo {
        string eventName;
        uint256 ticketPrice;
        uint256 maxSupply;
        uint256 ticketsSold;
        address tokenAddress;
        string baseURI;
    }

    EventInfo public eventInfo;

    constructor(
        string memory _eventName,
        uint256 _ticketPrice,
        uint256 _maxSupply,
        address _tokenAddress,
        address initialOwner,
        string memory _baseURI
    ) ERC721(_eventName, "TICKET") Ownable(initialOwner) {
        eventInfo = EventInfo({
            eventName: _eventName,
            ticketPrice: _ticketPrice,
            maxSupply: _maxSupply,
            ticketsSold: 0,
            tokenAddress: _tokenAddress,
            baseURI: _baseURI
        });
        _nextTokenId = 1;
    }

    function safeMint(address to) public {
        require(eventInfo.ticketsSold < eventInfo.maxSupply, "All tickets sold");
        require(
            IERC20(eventInfo.tokenAddress).balanceOf(msg.sender) >= eventInfo.ticketPrice,
            "Insufficient token balance"
        );
        require(
            IERC20(eventInfo.tokenAddress).allowance(msg.sender, address(this)) >= eventInfo.ticketPrice,
            "Token allowance too low"
        );
        
        IERC20(eventInfo.tokenAddress).transferFrom(msg.sender, address(this), eventInfo.ticketPrice);
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        eventInfo.ticketsSold++;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(eventInfo.baseURI, Strings.toString(tokenId)));
    }

    function withdrawTokens() public onlyOwner {
        uint256 balance = IERC20(eventInfo.tokenAddress).balanceOf(address(this));
        IERC20(eventInfo.tokenAddress).transfer(owner(), balance);
    }

    function getRemainingTickets() public view returns (uint256) {
        return eventInfo.maxSupply - eventInfo.ticketsSold;
    }
}

contract TicketFactory is Ownable {
    EventToken public immutable token;
    address[] public ticketEvents;
    
    event TicketEventCreated(address indexed ticketAddress, string eventName);
    event TokensPurchased(address indexed buyer, uint256 amount);

    constructor() Ownable(msg.sender) {
        token = new EventToken();
    }

    function createTicketEvent(
        string memory _eventName,
        uint256 _ticketPrice,
        uint256 _maxSupply,
        string memory _baseURI
    ) public onlyOwner returns (address) {
        TicketNFT newTicket = new TicketNFT(
            _eventName,
            _ticketPrice,
            _maxSupply,
            address(token),
            msg.sender,
            _baseURI
        );
        ticketEvents.push(address(newTicket));
        emit TicketEventCreated(address(newTicket), _eventName);
        return address(newTicket);
    }

    function buyTokens() public payable {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 tokensToMint = msg.value * 1000;
        token.mint(msg.sender, tokensToMint);
        emit TokensPurchased(msg.sender, tokensToMint);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getAllEvents() public view returns (address[] memory) {
        return ticketEvents;
    }
}