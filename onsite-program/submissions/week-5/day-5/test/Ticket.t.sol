// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/TicketContract.sol";

contract TicketPlatformTest is Test {
    TicketFactory public factory;
    EventToken public token;
    address owner = address(1);
    address user = address(2);
    
    function setUp() public {
        vm.startPrank(owner);
        factory = new TicketFactory();
        token = factory.token();
        vm.stopPrank();
    }

    function testFactoryDeployment() public view {
        assertEq(factory.owner(), owner);
        assertEq(token.name(), "EventToken");
        assertEq(token.symbol(), "EVT");
    }

    function testBuyTokens() public {
        vm.deal(user, 1 ether);
        vm.startPrank(user);
        
        uint256 initialBalance = token.balanceOf(user);
        factory.buyTokens{value: 0.1 ether}();
        
        assertEq(token.balanceOf(user), initialBalance + 100);
        vm.stopPrank();
    }

    function testCreateEvent() public {
        vm.startPrank(owner);
        
        address eventAddress = factory.createTicketEvent(
            "Concert", 
            10 ether,
            100,
            "https://example.com/tickets/"
        );
        
        TicketNFT eventContract = TicketNFT(eventAddress);
        assertEq(eventContract.owner(), owner);
        assertEq(eventContract.getRemainingTickets(), 100);
        assertEq(factory.getAllEvents().length, 1);
        vm.stopPrank();
    }

    function testBuyTicket() public {
        vm.startPrank(owner);
        address eventAddress = factory.createTicketEvent(
            "Concert", 
            10 ether,
            100, 
            "https://example.com/tickets/"
        );
        vm.stopPrank();
        
        vm.deal(user, 1 ether);
        vm.startPrank(user);
        factory.buyTokens{value: 0.1 ether}();
        token.approve(eventAddress, 10 ether);
        TicketNFT(eventAddress).safeMint(user);
        
        assertEq(TicketNFT(eventAddress).balanceOf(user), 1);
        assertEq(TicketNFT(eventAddress).getRemainingTickets(), 99);
        vm.stopPrank();
    }

    // Updated revert test using expectRevert
    function test_RevertWhen_BuyingTicketWithoutTokens() public {
        vm.startPrank(owner);
        address eventAddress = factory.createTicketEvent(
            "Concert", 
            10 ether, 
            100, 
            "https://example.com/tickets/"
        );
        vm.stopPrank();
        
        vm.startPrank(user);
        vm.expectRevert("Insufficient token balance");
        TicketNFT(eventAddress).safeMint(user);
    }

    function test_RevertWhen_EventSoldOut() public {
        vm.startPrank(owner);
        address eventAddress = factory.createTicketEvent(
            "VIP Event", 
            10 ether,
            1,
            "https://example.com/tickets/"
        );
        vm.stopPrank();
        
        // First user buys ticket
        vm.deal(user, 1 ether);
        vm.startPrank(user);
        factory.buyTokens{value: 0.1 ether}();
        token.approve(eventAddress, 10 ether);
        TicketNFT(eventAddress).safeMint(user);
        vm.stopPrank();
        
        // Second user tries to buy
        address user2 = address(3);
        vm.deal(user2, 1 ether);
        vm.startPrank(user2);
        factory.buyTokens{value: 0.1 ether}();
        token.approve(eventAddress, 10 ether);
        
        vm.expectRevert("All tickets sold");
        TicketNFT(eventAddress).safeMint(user2);
    }
}