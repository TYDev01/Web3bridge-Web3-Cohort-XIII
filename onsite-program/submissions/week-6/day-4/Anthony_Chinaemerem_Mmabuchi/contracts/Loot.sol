// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract LootBox is Ownable, VRFConsumerBaseV2 {
    using SafeERC20 for IERC20;

    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 tokenId; // For ERC721 and ERC1155
        uint256 amount;  // For ERC20 and ERC1155
        uint256 weight;
    }

    Reward[] public rewards;
    uint256 public totalWeight;
    uint256 public openFee;
    uint256 public openStartTimestamp;

    VRFCoordinatorV2Interface public coordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    mapping(uint256 => address) public requestToSender;
    mapping(uint256 => uint256) public requestToRandomWord;
    mapping(uint256 => bool) public requestFulfilled;

    event BoxOpened(address indexed user, uint256 requestId);
    event RandomnessFulfilled(uint256 requestId, uint256 randomWord);
    event RewardClaimed(address indexed user, uint256 requestId, uint256 rewardIndex);
    event RewardAdded(uint256 index, RewardType rewardType, address tokenAddress, uint256 tokenId, uint256 amount, uint256 weight);

    constructor(
        address vrfCoordinatorAddress,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint256 _openFee,
        uint256 _openStartTimestamp
    ) VRFConsumerBaseV2(vrfCoordinatorAddress) Ownable() {
        coordinator = VRFCoordinatorV2Interface(vrfCoordinatorAddress);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        openFee = _openFee;
        openStartTimestamp = _openStartTimestamp;
    }

    function addReward(
        RewardType _rewardType,
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _weight
    ) external onlyOwner {
        require(_weight > 0, "Weight must be positive");
        rewards.push(Reward({
            rewardType: _rewardType,
            tokenAddress: _tokenAddress,
            tokenId: _tokenId,
            amount: _amount,
            weight: _weight
        }));
        totalWeight += _weight;
        emit RewardAdded(rewards.length - 1, _rewardType, _tokenAddress, _tokenId, _amount, _weight);
    }

    function openBox() external payable {
        require(block.timestamp >= openStartTimestamp, "Opening not started yet");
        require(msg.value == openFee, "Incorrect fee");
        require(totalWeight > 0, "No rewards available");

        uint256 requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requestToSender[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        require(requestToSender[requestId] != address(0), "Request not found");
        requestToRandomWord[requestId] = randomWords[0];
        requestFulfilled[requestId] = true;
        emit RandomnessFulfilled(requestId, randomWords[0]);
    }

    function claimReward(uint256 requestId) external {
        require(requestFulfilled[requestId], "Randomness not fulfilled yet");
        require(requestToSender[requestId] != address(0), "Invalid request");
        address user = requestToSender[requestId];

        // Mark as claimed by deleting sender
        delete requestToSender[requestId];

        uint256 randomWord = requestToRandomWord[requestId];
        uint256 random = randomWord % totalWeight;
        uint256 cumulativeWeight = 0;
        uint256 selectedIndex = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            cumulativeWeight += rewards[i].weight;
            if (random < cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        _distributeReward(user, selectedIndex);

        emit RewardClaimed(user, requestId, selectedIndex);
    }

    function _distributeReward(address user, uint256 index) private {
        Reward storage r = rewards[index];

        if (r.rewardType == RewardType.ERC20) {
            IERC20(r.tokenAddress).safeTransfer(user, r.amount);
        } else if (r.rewardType == RewardType.ERC721) {
            IERC721(r.tokenAddress).safeTransferFrom(address(this), user, r.tokenId);
        } else if (r.rewardType == RewardType.ERC1155) {
            IERC1155(r.tokenAddress).safeTransferFrom(address(this), user, r.tokenId, r.amount, "");
        }
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function setOpenFee(uint256 _newFee) external onlyOwner {
        openFee = _newFee;
    }

    function setOpenStartTimestamp(uint256 _newTimestamp) external onlyOwner {
        openStartTimestamp = _newTimestamp;
    }
}
