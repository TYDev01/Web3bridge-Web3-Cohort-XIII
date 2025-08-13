// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 public nextTokenId;

    constructor() ERC721("DAO NFT", "DNFT") {}

    function mint(address to) external {
        _safeMint(to, nextTokenId++);
    }
}