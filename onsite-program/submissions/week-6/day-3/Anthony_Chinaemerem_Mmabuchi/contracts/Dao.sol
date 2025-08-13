// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC7432.sol";

contract Dao {
    address public immutable nftAddress;
    address public immutable rolesRegistry;
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(uint256 => bool) voted;
    }

    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description, uint256 endTime);
    event Voted(uint256 indexed proposalId, uint256 tokenId, bool support, address voter);

    constructor(address _nftAddress, address _rolesRegistry) {
        nftAddress = _nftAddress;
        rolesRegistry = _rolesRegistry;
    }

    function createProposal(uint256 tokenId, string calldata description, uint256 duration) external returns (uint256) {
        require(IERC7432(rolesRegistry).recipientOf(nftAddress, tokenId, MEMBER_ROLE) == msg.sender, "Caller does not have MEMBER role for this NFT");
        require(IERC7432(rolesRegistry).expirationDateOf(nftAddress, tokenId, MEMBER_ROLE) > block.timestamp, "Role expired");

        uint256 proposalId = nextProposalId++;
        Proposal storage prop = proposals[proposalId];
        prop.id = proposalId;
        prop.proposer = msg.sender;
        prop.description = description;
        prop.startTime = block.timestamp;
        prop.endTime = block.timestamp + duration;

        emit ProposalCreated(proposalId, msg.sender, description, prop.endTime);
        return proposalId;
    }

    function vote(uint256 proposalId, uint256 tokenId, bool support) external {
        Proposal storage prop = proposals[proposalId];
        require(block.timestamp >= prop.startTime && block.timestamp <= prop.endTime, "Voting period not active");
        require(!prop.voted[tokenId], "This NFT has already voted");
        require(IERC7432(rolesRegistry).recipientOf(nftAddress, tokenId, MEMBER_ROLE) == msg.sender, "Caller does not have MEMBER role for this NFT");
        require(IERC7432(rolesRegistry).expirationDateOf(nftAddress, tokenId, MEMBER_ROLE) > block.timestamp, "Role expired");

        prop.voted[tokenId] = true;
        if (support) {
            prop.votesFor += 1;
        } else {
            prop.votesAgainst += 1;
        }

        emit Voted(proposalId, tokenId, support, msg.sender);
    }

    function accessDaoResource(uint256 tokenId) external view returns (string memory) {
        require(IERC7432(rolesRegistry).recipientOf(nftAddress, tokenId, MEMBER_ROLE) == msg.sender, "Caller does not have MEMBER role for this NFT");
        require(IERC7432(rolesRegistry).expirationDateOf(nftAddress, tokenId, MEMBER_ROLE) > block.timestamp, "Role expired");
        return "Access granted to DAO resource";
    }

    function getProposalResults(uint256 proposalId) external view returns (uint256 votesFor, uint256 votesAgainst, bool passed) {
        Proposal storage prop = proposals[proposalId];
        require(block.timestamp > prop.endTime, "Voting not ended");
        passed = (prop.votesFor > prop.votesAgainst) && !prop.executed;
        return (prop.votesFor, prop.votesAgainst, passed);
    }
}