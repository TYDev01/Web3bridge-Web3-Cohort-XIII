// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./IERC7432.sol";

contract RolesRegistry is IERC7432 {
    struct RoleData {
        address recipient;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    mapping(address => mapping(uint256 => mapping(bytes32 => RoleData))) private _roles;
    mapping(address => mapping(address => mapping(address => bool))) private _roleApprovalForAll; 

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    function grantRole(Role calldata role) external {
        address tokenOwner = IERC721(role.tokenAddress).ownerOf(role.tokenId);
        require(msg.sender == tokenOwner || _roleApprovalForAll[role.tokenAddress][tokenOwner][msg.sender], "Not authorized to grant role");
        require(role.expirationDate > block.timestamp, "Expiration date must be in the future");

        _roles[role.tokenAddress][role.tokenId][role.roleId] = RoleData({
            recipient: role.recipient,
            expirationDate: role.expirationDate,
            revocable: role.revocable,
            data: role.data
        });

        emit RoleGranted(
            role.tokenAddress,
            role.tokenId,
            role.roleId,
            msg.sender,
            role.recipient,
            role.expirationDate,
            role.revocable,
            role.data
        );
    }

    function revokeRole(address tokenAddress, uint256 tokenId, bytes32 roleId) external {
        RoleData memory roleData = _roles[tokenAddress][tokenId][roleId];
        require(roleData.recipient != address(0), "Role not found");

        address tokenOwner = IERC721(tokenAddress).ownerOf(tokenId);
        bool isGrantor = msg.sender == tokenOwner || _roleApprovalForAll[tokenAddress][tokenOwner][msg.sender];
        bool isRecipient = msg.sender == roleData.recipient;

        require((isGrantor && roleData.revocable) || isRecipient, "Not authorized to revoke");

        delete _roles[tokenAddress][tokenId][roleId];
        emit RoleRevoked(tokenAddress, tokenId, roleId);
    }

    function setRoleApprovalForAll(address tokenAddress, address operator, bool approved) external {
        _roleApprovalForAll[tokenAddress][msg.sender][operator] = approved;
        emit RoleApprovalForAll(tokenAddress, operator, approved);
    }

    function unlockToken(address tokenAddress, uint256 tokenId) external {
        revert("Locking not supported in this implementation");
    }

    function recipientOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (address) {
        RoleData memory roleData = _roles[tokenAddress][tokenId][roleId];
        if (roleData.recipient == address(0) || roleData.expirationDate <= block.timestamp) {
            return address(0);
        }
        return roleData.recipient;
    }

    function expirationDateOf(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (uint64) {
        return _roles[tokenAddress][tokenId][roleId].expirationDate;
    }

    function isRevocable(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bool) {
        return _roles[tokenAddress][tokenId][roleId].revocable;
    }

    function roleData(address tokenAddress, uint256 tokenId, bytes32 roleId) external view returns (bytes memory) {
        return _roles[tokenAddress][tokenId][roleId].data;
    }

    function ownerOf(address tokenAddress, uint256 tokenId) external view returns (address) {
        return IERC721(tokenAddress).ownerOf(tokenId);
    }

    function isRoleApprovalForAll(address tokenAddress, address operator) external view returns (bool) {
        return _roleApprovalForAll[tokenAddress][msg.sender][operator];
    }
}