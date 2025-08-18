import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ClockNFT", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployClockNFTFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    const ClockNFT = await hre.ethers.getContractFactory("ClockNFT");
    const clockNFT = await ClockNFT.deploy();

    return { clockNFT, owner, otherAccount, thirdAccount };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);
      expect(await clockNFT.getAddress()).to.be.properAddress;
    });

    it("Should set the correct name and symbol", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);
      expect(await clockNFT.name()).to.equal("Clock NFT");
      expect(await clockNFT.symbol()).to.equal("UDEH");
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint NFT", async function () {
      const { clockNFT, owner } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      expect(await clockNFT.balanceOf(owner.address)).to.equal(1);
      expect(await clockNFT.ownerOf(0)).to.equal(owner.address);
    });

    it("Should allow different accounts to mint", async function () {
      const { clockNFT, owner, otherAccount } = await loadFixture(
        deployClockNFTFixture
      );

      await clockNFT.connect(owner).mint();
      await clockNFT.connect(otherAccount).mint();

      expect(await clockNFT.ownerOf(0)).to.equal(owner.address);
      expect(await clockNFT.ownerOf(1)).to.equal(otherAccount.address);
    });

    it("Should mint multiple NFTs with sequential token IDs starting from 0", async function () {
      const { clockNFT, owner } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      await clockNFT.mint();
      await clockNFT.mint();

      expect(await clockNFT.balanceOf(owner.address)).to.equal(3);
      expect(await clockNFT.ownerOf(0)).to.equal(owner.address);
      expect(await clockNFT.ownerOf(1)).to.equal(owner.address);
      expect(await clockNFT.ownerOf(2)).to.equal(owner.address);
    });

    it("Should emit Transfer event on mint", async function () {
      const { clockNFT, owner } = await loadFixture(deployClockNFTFixture);

      await expect(clockNFT.mint())
        .to.emit(clockNFT, "Transfer")
        .withArgs(hre.ethers.ZeroAddress, owner.address, 0);
    });

    it("Should increment token counter correctly", async function () {
      const { clockNFT, owner, otherAccount } = await loadFixture(
        deployClockNFTFixture
      );

      await clockNFT.connect(owner).mint();
      await clockNFT.connect(otherAccount).mint();
      await clockNFT.connect(owner).mint();

      expect(await clockNFT.ownerOf(0)).to.equal(owner.address);
      expect(await clockNFT.ownerOf(1)).to.equal(otherAccount.address);
      expect(await clockNFT.ownerOf(2)).to.equal(owner.address);
    });
  });

  describe("TokenURI", function () {
    it("Should return tokenURI for existing token", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      const tokenURI = await clockNFT.tokenURI(0);

      expect(tokenURI).to.include("data:application/json;base64,");
    });

    it("Should revert for non-existent token", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await expect(clockNFT.tokenURI(0)).to.be.revertedWith(
        "NFT does not exist"
      );
    });

    it("Should contain correct metadata structure", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      const tokenURI = await clockNFT.tokenURI(0);

      // Decode the base64 to check content
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const decodedJSON = Buffer.from(base64Data, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJSON);

      expect(metadata.name).to.equal("Blockchain Clock #0");
      expect(metadata.description).to.include("dynamic NFT");
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
      expect(metadata.animation_url).to.include("data:image/svg+xml;base64,");
      expect(metadata.attributes).to.be.an("array");
      expect(metadata.external_url).to.include(
        "https://your-website.com/clock/0"
      );
    });

    it("Should have correct attributes in metadata", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      const tokenURI = await clockNFT.tokenURI(0);

      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const decodedJSON = Buffer.from(base64Data, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJSON);

      const attributes = metadata.attributes;
      expect(attributes).to.have.lengthOf(4);

      const typeAttr = attributes.find(
        (attr: any) => attr.trait_type === "Type"
      );
      expect(typeAttr.value).to.equal("Dynamic Clock");

      const timestampAttr = attributes.find(
        (attr: any) => attr.trait_type === "Timestamp"
      );
      expect(parseInt(timestampAttr.value)).to.be.greaterThan(0);

      const timeAttr = attributes.find(
        (attr: any) => attr.trait_type === "Time"
      );
      expect(timeAttr.value).to.include("UTC");

      const blockAttr = attributes.find(
        (attr: any) => attr.trait_type === "Block Number"
      );
      expect(parseInt(blockAttr.value)).to.be.greaterThan(0);
    });

    it("Should update timestamp in real-time", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();

      const tokenURI1 = await clockNFT.tokenURI(0);

      // Increase time by 1 hour
      await time.increase(3600);

      const tokenURI2 = await clockNFT.tokenURI(0);

      // The tokenURIs should be different due to timestamp change
      expect(tokenURI1).to.not.equal(tokenURI2);
    });

    it("Should format time correctly", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      const tokenURI = await clockNFT.tokenURI(0);

      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const decodedJSON = Buffer.from(base64Data, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJSON);

      const timeAttr = metadata.attributes.find(
        (attr: any) => attr.trait_type === "Time"
      );

      // Should be in format "HH:MM:SS UTC"
      expect(timeAttr.value).to.match(/^\d{2}:\d{2}:\d{2} UTC$/);
    });

    it("Should contain valid SVG in image data", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      const tokenURI = await clockNFT.tokenURI(0);

      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const decodedJSON = Buffer.from(base64Data, "base64").toString("utf-8");
      const metadata = JSON.parse(decodedJSON);

      const imageData = metadata.image.replace(
        "data:image/svg+xml;base64,",
        ""
      );
      const svgContent = Buffer.from(imageData, "base64").toString("utf-8");

      expect(svgContent).to.include("<svg");
      expect(svgContent).to.include("BLOCKCHAIN CLOCK");
      expect(svgContent).to.include("UTC");
      expect(svgContent).to.include("Last updated:");
      expect(svgContent).to.include("</svg>");
    });

    it("Should have different tokenURIs for different token IDs", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      await clockNFT.mint();
      await clockNFT.mint();

      const tokenURI0 = await clockNFT.tokenURI(0);
      const tokenURI1 = await clockNFT.tokenURI(1);

      // Decode both to check they have different names
      const base64Data0 = tokenURI0.replace(
        "data:application/json;base64,",
        ""
      );
      const metadata0 = JSON.parse(
        Buffer.from(base64Data0, "base64").toString("utf-8")
      );

      const base64Data1 = tokenURI1.replace(
        "data:application/json;base64,",
        ""
      );
      const metadata1 = JSON.parse(
        Buffer.from(base64Data1, "base64").toString("utf-8")
      );

      expect(metadata0.name).to.equal("Blockchain Clock #0");
      expect(metadata1.name).to.equal("Blockchain Clock #1");
      expect(metadata0.external_url).to.include("/clock/0");
      expect(metadata1.external_url).to.include("/clock/1");
    });
  });

  describe("ERC721 Standard Compliance", function () {
    it("Should support ERC721 interface", async function () {
      const { clockNFT } = await loadFixture(deployClockNFTFixture);

      // ERC721 interface ID
      expect(await clockNFT.supportsInterface("0x80ac58cd")).to.be.true;

      // ERC721Metadata interface ID
      expect(await clockNFT.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("Should allow token transfers", async function () {
      const { clockNFT, owner, otherAccount } = await loadFixture(
        deployClockNFTFixture
      );

      await clockNFT.mint();

      await clockNFT.transferFrom(owner.address, otherAccount.address, 0);

      expect(await clockNFT.ownerOf(0)).to.equal(otherAccount.address);
      expect(await clockNFT.balanceOf(owner.address)).to.equal(0);
      expect(await clockNFT.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should allow approval and transferFrom", async function () {
      const { clockNFT, owner, otherAccount } = await loadFixture(
        deployClockNFTFixture
      );

      await clockNFT.mint();
      await clockNFT.approve(otherAccount.address, 0);

      await clockNFT
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, 0);

      expect(await clockNFT.ownerOf(0)).to.equal(otherAccount.address);
    });

    it("Should allow setting approval for all", async function () {
      const { clockNFT, owner, otherAccount } = await loadFixture(
        deployClockNFTFixture
      );

      await clockNFT.mint();
      await clockNFT.setApprovalForAll(otherAccount.address, true);

      expect(
        await clockNFT.isApprovedForAll(owner.address, otherAccount.address)
      ).to.be.true;

      await clockNFT
        .connect(otherAccount)
        .transferFrom(owner.address, otherAccount.address, 0);

      expect(await clockNFT.ownerOf(0)).to.equal(otherAccount.address);
    });
  });
});