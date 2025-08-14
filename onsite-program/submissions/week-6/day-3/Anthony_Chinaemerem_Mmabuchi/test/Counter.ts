import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("TokenGatedDAO", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer, user1, user2] = await viem.getWalletClients();
  const MEMBER_ROLE = keccak256(toUtf8Bytes("MEMBER"));

  it("Should deploy MyNFT, RolesRegistry, and Dao contracts", async function () {
    const myNFT = await viem.deployContract("MyNFT");
    const rolesRegistry = await viem.deployContract("RolesRegistry");
    const dao = await viem.deployContract("Dao", [myNFT.address, rolesRegistry.address]);

    assert.ok(myNFT.address, "MyNFT address should be defined");
    assert.ok(rolesRegistry.address, "RolesRegistry address should be defined");
    assert.ok(dao.address, "Dao address should be defined");
    assert.equal(await dao.read.nftAddress(), myNFT.address, "Dao should reference correct NFT address");
    assert.equal(await dao.read.rolesRegistry(), rolesRegistry.address, "Dao should reference correct RolesRegistry address");
  });

  it("Should grant MEMBER role and emit RoleGranted event", async function () {
    const myNFT = await viem.deployContract("MyNFT");
    const rolesRegistry = await viem.deployContract("RolesRegistry");

    await myNFT.write.mint([user1.account.address]);
    const role = {
      roleId: MEMBER_ROLE,
      tokenAddress: myNFT.address,
      tokenId: 0n,
      recipient: user1.account.address,
      expirationDate: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
      revocable: true,
      data: "0x",
    };

    await viem.assertions.emitWithArgs(
      rolesRegistry.write.grantRole([role]),
      rolesRegistry,
      "RoleGranted",
      [myNFT.address, 0n, MEMBER_ROLE, deployer.account.address, user1.account.address, role.expirationDate, true, "0x"],
    );

    const recipient = await rolesRegistry.read.recipientOf([myNFT.address, 0n, MEMBER_ROLE]);
    assert.equal(recipient, user1.account.address, "User1 should be the recipient of the MEMBER role");
  });

  it("Should allow user with MEMBER role to create a proposal and emit ProposalCreated event", async function () {
    const myNFT = await viem.deployContract("MyNFT");
    const rolesRegistry = await viem.deployContract("RolesRegistry");
    const dao = await viem.deployContract("Dao", [myNFT.address, rolesRegistry.address]);

    await myNFT.write.mint([user1.account.address]);
    const role = {
      roleId: MEMBER_ROLE,
      tokenAddress: myNFT.address,
      tokenId: 0n,
      recipient: user1.account.address,
      expirationDate: BigInt(Math.floor(Date.now() / 1000) + 3600),
      revocable: true,
      data: "0x",
    };
    await rolesRegistry.write.grantRole([role]);

    const description = "Test proposal";
    const duration = 86400n; // 1 day
    await viem.assertions.emitWithArgs(
      dao.write.createProposal([0n, description, duration], { account: user1 }),
      dao,
      "ProposalCreated",
      [0n, user1.account.address, description, BigInt(await publicClient.getBlock({ blockTag: "latest" }).then(b => b.timestamp)) + duration],
    );

    const proposal = await dao.read.proposals([0n]);
    assert.equal(proposal[0], 0n, "Proposal ID should be 0");
    assert.equal(proposal[1], user1.account.address, "Proposer should be user1");
    assert.equal(proposal[2], description, "Proposal description should match");
  });

  it("Should allow user with MEMBER role to vote and emit Voted event", async function () {
    const myNFT = await viem.deployContract("MyNFT");
    const rolesRegistry = await viem.deployContract("RolesRegistry");
    const dao = await viem.deployContract("Dao", [myNFT.address, rolesRegistry.address]);

    await myNFT.write.mint([user1.account.address]);
    const role = {
      roleId: MEMBER_ROLE,
      tokenAddress: myNFT.address,
      tokenId: 0n,
      recipient: user1.account.address,
      expirationDate: BigInt(Math.floor(Date.now() / 1000) + 3600),
      revocable: true,
      data: "0x",
    };
    await rolesRegistry.write.grantRole([role]);
    await dao.write.createProposal([0n, "Test proposal", 86400n], { account: user1 });

    await viem.assertions.emitWithArgs(
      dao.write.vote([0n, 0n, true], { account: user1 }),
      dao,
      "Voted",
      [0n, 0n, true, user1.account.address],
    );

    const proposal = await dao.read.proposals([0n]);
    assert.equal(proposal[3], 1n, "VotesFor should be 1");
  });

  it("Should prevent user without MEMBER role from voting", async function () {
    const myNFT = await viem.deployContract("MyNFT");
    const rolesRegistry = await viem.deployContract("RolesRegistry");
    const dao = await viem.deployContract("Dao", [myNFT.address, rolesRegistry.address]);

    await myNFT.write.mint([user1.account.address]);
    await dao.write.createProposal([0n, "Test proposal", 86400n], { account: user1 }); // No MEMBER role granted

    await assert.rejects(
      dao.write.vote([0n, 0n, true], { account: user1 }),
      { message: /Caller does not have MEMBER role for this NFT/ },
      "Should revert if user lacks MEMBER role"
    );
  });
});