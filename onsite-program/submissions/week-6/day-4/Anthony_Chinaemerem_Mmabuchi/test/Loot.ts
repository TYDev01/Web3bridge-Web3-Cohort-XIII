import { expect } from "chai";
import { network } from "hardhat";

describe("LootBox", function () {
  async function deployLootBoxFixture() {
    const { ethers } = await network.connect();
    const [owner, user] = await ethers.getSigners();

  
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfMock = await VRFCoordinatorV2Mock.deploy(
      ethers.parseEther("0.000000001"),
      ethers.parseEther("0.000000001")
    );
    const fundAmount = ethers.parseEther("10");
    const tx = await vrfMock.createSubscription();
    const receipt = await tx.wait();
    const subscriptionId = receipt?.logs[0].topics[1]
      ? BigInt(receipt.logs[0].topics[1])
      : 1n;
    await vrfMock.fundSubscription(subscriptionId, fundAmount);

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20 = await ERC20Mock.deploy("TestToken", "TT");
    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    const erc721 = await ERC721Mock.deploy("TestNFT", "TNFT");
    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
    const erc1155 = await ERC1155Mock.deploy("https://example.com/");

    const keyHash = "0x474e34a077df58807dbe9c96d3c009B23b3c6d0cce433e59bbf5b34f823bc56c";
    const openFee = ethers.parseEther("0.01");
    const openStartTimestamp = Math.floor(Date.now() / 1000);
    const LootBox = await ethers.getContractFactory("LootBox");
    const lootBox = await LootBox.deploy(
      await vrfMock.getAddress(),
      subscriptionId,
      keyHash,
      openFee,
      openStartTimestamp
    );

    await erc20.mint(await lootBox.getAddress(), 1000);
    await erc721.mint(await lootBox.getAddress(), 1);
    await erc1155.mint(await lootBox.getAddress(), 1, 100, "0x");

    await lootBox.addReward(0, await erc20.getAddress(), 0, 100, 100); // ERC20
    await lootBox.addReward(1, await erc721.getAddress(), 1, 1, 200); // ERC721
    await lootBox.addReward(2, await erc1155.getAddress(), 1, 50, 300); // ERC1155

    return { lootBox, vrfMock, erc20, erc721, erc1155, owner, user, subscriptionId };
  }

  it("Should emit BoxOpened event when opening a box", async function () {
    const { lootBox, user } = await deployLootBoxFixture();
    const openFee = await lootBox.openFee();

    await expect(lootBox.connect(user).openBox({ value: openFee }))
      .to.emit(lootBox, "BoxOpened")
      .withArgs(user.address, (requestId: bigint) => typeof requestId === "bigint");
  });

  it("Should emit RandomnessFulfilled and allow claiming rewards", async function () {
    const { lootBox, vrfMock, user, erc20, erc721, erc1155 } = await deployLootBoxFixture();
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();
    const openFee = await lootBox.openFee();


    const openTx = await lootBox.connect(user).openBox({ value: openFee });
    const openReceipt = await openTx.wait();
    const boxOpenedEvent = openReceipt?.logs.find((log) => log.fragment?.name === "BoxOpened");
    const requestId = boxOpenedEvent?.args.requestId;


    await expect(vrfMock.fulfillRandomWords(requestId, await lootBox.getAddress()))
      .to.emit(lootBox, "RandomnessFulfilled")
      .withArgs(requestId, (randomWord: bigint) => typeof randomWord === "bigint");

    const claimTx = await lootBox.connect(user).claimReward(requestId);
    const claimReceipt = await claimTx.wait();
    const rewardClaimedEvent = claimReceipt?.logs.find((log) => log.fragment?.name === "RewardClaimed");
    const rewardIndex = rewardClaimedEvent?.args.rewardIndex;


    const events = await lootBox.queryFilter(
      lootBox.filters.RewardClaimed(),
      deploymentBlockNumber,
      "latest"
    );
    expect(events.length).to.equal(1);
    expect(events[0].args.user).to.equal(user.address);
    expect(events[0].args.requestId).to.equal(requestId);

    if (rewardIndex === 0n) {
      expect(await erc20.balanceOf(user.address)).to.equal(100);
    } else if (rewardIndex === 1n) {
      expect(await erc721.ownerOf(1)).to.equal(user.address);
    } else if (rewardIndex === 2n) {
      expect(await erc1155.balanceOf(user.address, 1)).to.equal(50);
    }
  });

  it("Should correctly track totalWeight after adding rewards", async function () {
    const { lootBox } = await deployLootBoxFixture();
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();


    const events = await lootBox.queryFilter(
      lootBox.filters.RewardAdded(),
      deploymentBlockNumber,
      "latest"
    );


    let totalWeight = 0n;
    for (const event of events) {
      totalWeight += event.args.weight;
    }


    expect(await lootBox.totalWeight()).to.equal(totalWeight);
  });
});


const ERC20Mock = `
contract ERC20Mock {
    string public name;
    string public symbol;
    mapping(address => uint256) public balanceOf;
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}
`;

const ERC721Mock = `
contract ERC721Mock {
    string public name;
    string public symbol;
    mapping(uint256 => address) public ownerOf;
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    function mint(address to, uint256 tokenId) external {
        ownerOf[tokenId] = to;
    }
}
`;

const ERC1155Mock = `
contract ERC1155Mock {
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    constructor(string memory) {}
    function mint(address to, uint256 id, uint256 amount, bytes memory) external {
        balanceOf[to][id] += amount;
    }
}
`;