// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Lottery {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    
    uint256 public constant MAX_PLAYERS = 10;
    
    address payable[] public players;
    
    mapping(address => bool) public hasEntered;
    
    uint256 public currentRound;
    
    address public owner;
    
    event PlayerJoined(address indexed player, uint256 round, uint256 playerCount);
    event WinnerSelected(address indexed winner, uint256 amount, uint256 round);
    event LotteryReset(uint256 newRound);
    
    // Custom errors
    error IncorrectEntryFee();
    error AlreadyEntered();
    error LotteryFull();
    error NoPlayersInLottery();
    error TransferFailed();

    // Set the deployer as owner
    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }
  
    function enterLottery() external payable {
        // Check if the correct entry fee is sent
        if (msg.value != ENTRY_FEE) {
            revert IncorrectEntryFee();
        }
        
        // Check if player has already entered this round
        if (hasEntered[msg.sender]) {
            revert AlreadyEntered();
        }
        
        // Check if lottery is not full
        if (players.length >= MAX_PLAYERS) {
            revert LotteryFull();
        }
        
        // Add player to the lottery //
        players.push(payable(msg.sender));
        hasEntered[msg.sender] = true;
        
        emit PlayerJoined(msg.sender, currentRound, players.length);
        
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
   
    function _selectWinner() internal {
        if (players.length == 0) {
            revert NoPlayersInLottery();
        }
        
        // Generate random number
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.difficulty,
                    players.length,
                    currentRound
                )
            )
        ) % players.length;
        
        address payable winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance;
        
        emit WinnerSelected(winner, prizeAmount, currentRound);
        
        // Reset the lottery for the next round
        _resetLottery();
        
        // Transfer the prize to the winner
        (bool success, ) = winner.call{value: prizeAmount}("");
        if (!success) {
            revert TransferFailed();
        }
    }
    
    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        delete players;
        
        currentRound++;
        
        emit LotteryReset(currentRound);
    }
  
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    function getPlayers() external view returns (address payable[] memory) {
        return players;
    }
    
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
    
    function getLotteryInfo() external view returns (
        uint256 playerCount,
        uint256 prizePool,
        uint256 round,
        uint256 entryFee,
        uint256 maxPlayers
    ) {
        return (
            players.length,
            address(this).balance,
            currentRound,
            ENTRY_FEE,
            MAX_PLAYERS
        );
    }
}
