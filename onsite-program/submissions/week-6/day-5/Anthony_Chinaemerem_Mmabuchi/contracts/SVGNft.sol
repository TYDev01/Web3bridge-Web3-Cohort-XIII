// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SVGNft is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("The Big Clock", "TBC") {}

    function mint() public {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");

        uint256 timestamp = block.timestamp;
        
        (uint256 hrs, uint256 mins, uint256 secs) = _splitTimestamp(timestamp);

        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">',
            '<defs>',
            '<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" stop-color="#0f0c29"/>',
            '<stop offset="50%" stop-color="#302b63"/>',
            '<stop offset="100%" stop-color="#24243e"/>',
            '</linearGradient>',
            '<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">',
            '<feGaussianBlur stdDeviation="5" result="blur"/>',
            '<feComposite in="SourceGraphic" in2="blur" operator="over"/>',
            '</filter>',
            '</defs>',
            '<rect width="100%" height="100%" fill="url(#gradient)"/>',
            '<circle cx="250" cy="250" r="200" fill="none" stroke="#ffffff20" stroke-width="2"/>',
            '<circle cx="250" cy="250" r="180" fill="none" stroke="#ffffff10" stroke-width="2"/>',
            '<text x="50%" y="30%" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" dominant-baseline="middle">BLOCKCHAIN TIME</text>',
            '<text x="50%" y="50%" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" dominant-baseline="middle" filter="url(#glow)">',
            _formatTime(hrs, mins, secs),
            '</text>',
            '<text x="50%" y="70%" fill="#FFFFFF80" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">BLOCK TIMESTAMP: ',
            Strings.toString(timestamp),
            '</text>',
            '</svg>'
        ));

        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Blockchain Clock #', Strings.toString(tokenId), '",',
                        '"description": "A dynamic NFT that displays the current blockchain timestamp, updating with each block.",',
                        '"image": "data:image/svg+xml;base64,', svgBase64, '",',
                        '"attributes": [',
                            '{"trait_type": "Type", "value": "Dynamic Clock"},',
                            '{"trait_type": "Timestamp", "value": "', Strings.toString(timestamp), '"},',
                            '{"trait_type": "Time", "value": "', _formatTime(hrs, mins, secs), '"},',
                            '{"trait_type": "Block Number", "value": "', Strings.toString(block.number), '"}',
                        '],',
                        '"external_url": "https://your-website.com/clock/', Strings.toString(tokenId), '",',
                        '"animation_url": "data:image/svg+xml;base64,', svgBase64, '"',
                        '}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _splitTimestamp(uint256 timestamp) private pure returns (uint256 h, uint256 m, uint256 s) {
        h = (timestamp / 3600) % 24;
        m = (timestamp / 60) % 60;
        s = timestamp % 60;
    }

    function _formatTime(uint256 h, uint256 m, uint256 s) private pure returns (string memory) {
        return string(abi.encodePacked(
            _twoDigits(h), ":", _twoDigits(m), ":", _twoDigits(s), " UTC"
        ));
    }

    function _twoDigits(uint256 num) private pure returns (string memory) {
        return num < 10 ? string(abi.encodePacked("0", Strings.toString(num))) : Strings.toString(num);
    }
}