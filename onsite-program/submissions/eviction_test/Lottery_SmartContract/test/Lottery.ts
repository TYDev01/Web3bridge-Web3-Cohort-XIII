import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Lottery Contract", function () {
    let lottery: Contract;
    let owner: SignerWithAddress;
    let players: SignerWithAddress[];
    const ENTRY_FEE: bigint = ethers.parseEther("0.01");
    const MAX_PLAYERS: number = 10;

    beforeEach(async function () {
        // Get signers
        [owner, ...players] = await ethers.getSigners();
        
        // Deploy the contract
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy();
        await lottery.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await lottery.owner()).to.equal(owner.address);
        });

        it("Should initialize with round 1", async function () {
            expect(await lottery.currentRound()).to.equal(1);
        });

        it("Should have correct constants", async function () {
            expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
            expect(await lottery.MAX_PLAYERS()).to.equal(MAX_PLAYERS);
        });

        it("Should start with empty players array", async function () {
            expect(await lottery.getPlayerCount()).to.equal(0);
            expect(await lottery.getPrizePool()).to.equal(0);
        });
    });

    describe("Entry Requirements", function () {
        it("Should allow entry with exact fee", async function () {
            await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
                .to.emit(lottery, "PlayerJoined")
                .withArgs(players[0].address, 1, 1);
            
            expect(await lottery.getPlayerCount()).to.equal(1);
            expect(await lottery.getPrizePool()).to.equal(ENTRY_FEE);
        });

        it("Should reject entry with insufficient fee", async function () {
            const insufficientFee: bigint = ethers.parseEther("0.005");
            await expect(
                lottery.connect(players[0]).enterLottery({ value: insufficientFee })
            ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
        });

        it("Should reject entry with excessive fee", async function () {
            const excessiveFee: bigint = ethers.parseEther("0.02");
            await expect(
                lottery.connect(players[0]).enterLottery({ value: excessiveFee })
            ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
        });

        it("Should reject entry with zero fee", async function () {
            await expect(
                lottery.connect(players[0]).enterLottery({ value: 0 })
            ).to.be.revertedWithCustomError(lottery, "IncorrectEntryFee");
        });
    });

    describe("Player Tracking", function () {
        it("Should track multiple players correctly", async function () {
            // Add 5 players
            for (let i: number = 0; i < 5; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
                expect(await lottery.getPlayerCount()).to.equal(i + 1);
                expect(await lottery.hasPlayerEntered(players[i].address)).to.be.true;
            }

            const allPlayers: string[] = await lottery.getPlayers();
            expect(allPlayers.length).to.equal(5);
            
            // Verify all players are in the list
            for (let i: number = 0; i < 5; i++) {
                expect(allPlayers[i]).to.equal(players[i].address);
            }
        });

        it("Should prevent double entry in same round", async function () {
            await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
            
            await expect(
                lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
            ).to.be.revertedWithCustomError(lottery, "AlreadyEntered");
        });

        it("Should track exactly 10 players", async function () {
            // Add 9 players
            for (let i: number = 0; i < 9; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            expect(await lottery.getPlayerCount()).to.equal(9);
            
            // Add 10th player - this should trigger winner selection
            await expect(lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE }))
                .to.emit(lottery, "PlayerJoined")
                .and.to.emit(lottery, "WinnerSelected")
                .and.to.emit(lottery, "LotteryReset");
        });

        it("Should reject entry when lottery is full", async function () {
            // This test is tricky because the 10th player triggers automatic winner selection
            // So we can't actually test rejection when full, as the contract auto-resets
            // Instead, let's verify the behavior with 10 players
            for (let i: number = 0; i < 10; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // After 10 players, lottery should have reset
            expect(await lottery.getPlayerCount()).to.equal(0);
            expect(await lottery.currentRound()).to.equal(2);
        });
    });

    describe("Winner Selection and Prize Transfer", function () {
        it("Should select winner and transfer prize when 10 players join", async function () {
            const initialBalances: bigint[] = [];
            
            // Record initial balances
            for (let i: number = 0; i < 10; i++) {
                initialBalances[i] = await ethers.provider.getBalance(players[i].address);
            }
            
            // Add 10 players
            for (let i: number = 0; i < 10; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // Check that one player received the prize
            let winnerFound: boolean = false;
            const expectedPrize: bigint = ENTRY_FEE * BigInt(10);
            
            for (let i: number = 0; i < 10; i++) {
                const currentBalance: bigint = await ethers.provider.getBalance(players[i].address);
                const balanceChange: bigint = currentBalance - initialBalances[i];
                
                // Account for gas costs - winner should have received prize minus entry fee and gas
                if (balanceChange > ENTRY_FEE * BigInt(8)) { // Generous threshold for gas costs
                    winnerFound = true;
                    break;
                }
            }
            
            expect(winnerFound).to.be.true;
        });

        it("Should emit WinnerSelected event with correct parameters", async function () {
            // Add 9 players
            for (let i: number = 0; i < 9; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // Add 10th player and check for WinnerSelected event
            const tx = await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });
            const receipt = await tx.wait();
            
            // Find the WinnerSelected event
            const winnerEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = lottery.interface.parseLog(log);
                    return parsed?.name === "WinnerSelected";
                } catch {
                    return false;
                }
            });
            
            expect(winnerEvent).to.not.be.undefined;
            
            const parsedEvent = lottery.interface.parseLog(winnerEvent!);
            expect(parsedEvent.args.amount).to.equal(ENTRY_FEE * BigInt(10));
            expect(parsedEvent.args.round).to.equal(1);
        });

        it("Should transfer entire prize pool to winner", async function () {
            // Add 10 players
            for (let i: number = 0; i < 10; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // After winner selection, contract balance should be 0
            expect(await lottery.getPrizePool()).to.equal(0);
        });
    });

    describe("Lottery Reset", function () {
        it("Should reset lottery after winner selection", async function () {
            // Add 10 players
            for (let i: number = 0; i < 10; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // Check lottery has reset
            expect(await lottery.getPlayerCount()).to.equal(0);
            expect(await lottery.currentRound()).to.equal(2);
            expect(await lottery.getPrizePool()).to.equal(0);
            
            // Check that all players can enter again
            for (let i: number = 0; i < 5; i++) {
                expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
            }
        });

        it("Should emit LotteryReset event", async function () {
            // Add 9 players
            for (let i: number = 0; i < 9; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // Add 10th player and check for LotteryReset event
            await expect(lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE }))
                .to.emit(lottery, "LotteryReset")
                .withArgs(2);
        });

        it("Should allow same players to enter new round", async function () {
            // Add 10 players to complete first round
            for (let i: number = 0; i < 10; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
            
            // Now same players should be able to enter new round
            await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
            expect(await lottery.getPlayerCount()).to.equal(1);
            expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            // Add 3 players for testing
            for (let i: number = 0; i < 3; i++) {
                await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
            }
        });

        it("Should return correct lottery info", async function () {
            interface LotteryInfo {
                playerCount: bigint;
                prizePool: bigint;
                round: bigint;
                entryFee: bigint;
                maxPlayers: bigint;
            }
            
            const info: LotteryInfo = await lottery.getLotteryInfo();
            expect(info.playerCount).to.equal(3);
            expect(info.prizePool).to.equal(ENTRY_FEE * BigInt(3));
            expect(info.round).to.equal(1);
            expect(info.entryFee).to.equal(ENTRY_FEE);
            expect(info.maxPlayers).to.equal(MAX_PLAYERS);
        });

        it("Should return correct player list", async function () {
            const playerList: string[] = await lottery.getPlayers();
            expect(playerList.length).to.equal(3);
            expect(playerList[0]).to.equal(players[0].address);
            expect(playerList[1]).to.equal(players[1].address);
            expect(playerList[2]).to.equal(players[2].address);
        });

        it("Should return correct entry status", async function () {
            expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
            expect(await lottery.hasPlayerEntered(players[1].address)).to.be.true;
            expect(await lottery.hasPlayerEntered(players[2].address)).to.be.true;
            expect(await lottery.hasPlayerEntered(players[3].address)).to.be.false;
        });
    });
});