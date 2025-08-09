// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TicketFactory} from "../src/TicketContract.sol";
import {TicketNFT} from "../src/TicketContract.sol";
import {EventToken} from "../src/TicketContract.sol";

contract DeployTicketContract is Script {
    TicketFactory public factory;
    TicketNFT public sampleEvent;
    EventToken public token;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployerAddress);
        console.log("Deployer balance:", deployerAddress.balance);

        vm.startBroadcast(deployerPrivateKey);

        
        factory = new TicketFactory();
        token = factory.token();
        
        console.log("TicketFactory deployed at:", address(factory));
        console.log("EventToken deployed at:", address(token));

        address eventAddress = factory.createTicketEvent(
            "Web3Bridge Concert", 
            0.05 ether,
            1000,
            "ipfs://bafybeiennxurk2ccpgm7jwjl5kfhhzhyrjpiskuhhhhkkpvpkc2pzb2esy/"
        );
        sampleEvent = TicketNFT(eventAddress);
        

        (string memory eventName, 
         uint256 ticketPrice, 
         uint256 maxSupply, 
         uint256 ticketsSold, 
         address tokenAddress, 
         string memory baseURI) = sampleEvent.eventInfo();
        
        console.log("Sample TicketNFT event deployed at:", eventAddress);
        console.log("Event name:", eventName);
        console.log("Ticket price:", ticketPrice / 1 ether, "tokens");
        console.log("Max supply:", maxSupply);

        vm.stopBroadcast();

        console.log("\nNext steps:");
        console.log("1. Users can buy tokens by sending ETH to factory.buyTokens()");
        console.log("2. Approve the TicketNFT contract to spend user's tokens");
        console.log("3. Call safeMint() on the TicketNFT contract to purchase tickets");
    }
}