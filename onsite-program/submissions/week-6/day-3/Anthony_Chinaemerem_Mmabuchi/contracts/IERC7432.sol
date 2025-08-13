// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IERC7432 is IERC165 {
    struct Role {
        bytes32 roleId;
        address tokenAddress;
        uint256 tokenId;
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    event RoleGranted(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId,
        address grantor,
        address recipient,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        bytes32 indexed roleId
    );

    event RoleApprovalForAll(
        address indexed tokenAddress,
        address indexed operator,
        bool approved
    );

    function grantRole(Role calldata role) external;

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external;

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external;

    function unlockToken(address tokenAddress, uint256 tokenId) external;

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address);

    function expirationDateOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64);

    function isRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool);

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory);

    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address);

    function isRoleApprovalForAll(address tokenAddress, address operator) external view returns (bool);
}