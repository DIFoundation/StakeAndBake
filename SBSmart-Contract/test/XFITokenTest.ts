import { expect } from "chai";
import { ethers } from "hardhat";
import { XFIToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("XFIToken", function () {
  let xfiToken: XFIToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const TOKEN_NAME = "Cross Finance Token";
  const TOKEN_SYMBOL = "XFI";
  const INITIAL_SUPPLY = 1000000; // 1 million tokens
  const DECIMALS = 18;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const XFITokenFactory = await ethers.getContractFactory("XFIToken");
    xfiToken = await XFITokenFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await xfiToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await xfiToken.balanceOf(owner.address);
      const totalSupply = await xfiToken.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await xfiToken.name()).to.equal(TOKEN_NAME);
      expect(await xfiToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the correct decimals", async function () {
      expect(await xfiToken.decimals()).to.equal(DECIMALS);
    });

    it("Should mint initial supply with correct decimals", async function () {
      const expectedSupply = ethers.parseUnits(INITIAL_SUPPLY.toString(), DECIMALS);
      const actualSupply = await xfiToken.totalSupply();
      expect(actualSupply).to.equal(expectedSupply);
    });

    it("Should emit TokensMinted event on deployment", async function () {
        const XFITokenFactory = await ethers.getContractFactory("XFIToken");
        const expectedAmount = BigInt(INITIAL_SUPPLY * 10**DECIMALS);// This matches what the contract does
        
        const deploymentTx = XFITokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
        
        await expect(deploymentTx)
          .to.emit(await deploymentTx, "TokensMinted")
          .withArgs(owner.address, expectedAmount);
      });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      const initialBalance = await xfiToken.balanceOf(addr1.address);
      
      await xfiToken.mint(addr1.address, mintAmount);
      
      const finalBalance = await xfiToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance + mintAmount);
    });

    it("Should increase total supply when minting", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      const initialSupply = await xfiToken.totalSupply();
      
      await xfiToken.mint(addr1.address, mintAmount);
      
      const finalSupply = await xfiToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply + mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(xfiToken.mint(addr1.address, mintAmount))
        .to.emit(xfiToken, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
    });

    it("Should revert if non-owner tries to mint", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(
        xfiToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(xfiToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      const transferAmount = ethers.parseUnits("10000", DECIMALS);
      await xfiToken.transfer(addr1.address, transferAmount);
    });

    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const initialBalance = await xfiToken.balanceOf(addr1.address);
      
      await xfiToken.connect(addr1).burn(burnAmount);
      
      const finalBalance = await xfiToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should decrease total supply when burning", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const initialSupply = await xfiToken.totalSupply();
      
      await xfiToken.connect(addr1).burn(burnAmount);
      
      const finalSupply = await xfiToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply - burnAmount);
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(xfiToken.connect(addr1).burn(burnAmount))
        .to.emit(xfiToken, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });

    it("Should revert if trying to burn more than balance", async function () {
      const balance = await xfiToken.balanceOf(addr1.address);
      const burnAmount = balance + ethers.parseUnits("1", DECIMALS);
      
      await expect(
        xfiToken.connect(addr1).burn(burnAmount)
      ).to.be.revertedWithCustomError(xfiToken, "ERC20InsufficientBalance");
    });
  });

  describe("Burn From", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      const transferAmount = ethers.parseUnits("10000", DECIMALS);
      await xfiToken.transfer(addr1.address, transferAmount);
    });

    it("Should allow burning tokens with approval", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const initialBalance = await xfiToken.balanceOf(addr1.address);
      
      // addr1 approves addr2 to spend tokens
      await xfiToken.connect(addr1).approve(addr2.address, burnAmount);
      
      // addr2 burns tokens from addr1
      await xfiToken.connect(addr2).burnFrom(addr1.address, burnAmount);
      
      const finalBalance = await xfiToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should decrease allowance when burning", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const approveAmount = ethers.parseUnits("2000", DECIMALS);
      
      await xfiToken.connect(addr1).approve(addr2.address, approveAmount);
      
      await xfiToken.connect(addr2).burnFrom(addr1.address, burnAmount);
      
      const remainingAllowance = await xfiToken.allowance(addr1.address, addr2.address);
      expect(remainingAllowance).to.equal(approveAmount - burnAmount);
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      
      await xfiToken.connect(addr1).approve(addr2.address, burnAmount);
      
      await expect(xfiToken.connect(addr2).burnFrom(addr1.address, burnAmount))
        .to.emit(xfiToken, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });

    it("Should revert if insufficient allowance", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const approveAmount = ethers.parseUnits("500", DECIMALS);
      
      await xfiToken.connect(addr1).approve(addr2.address, approveAmount);
      
      await expect(
        xfiToken.connect(addr2).burnFrom(addr1.address, burnAmount)
      ).to.be.revertedWithCustomError(xfiToken, "ERC20InsufficientAllowance");
    });

    it("Should revert if insufficient balance", async function () {
      const balance = await xfiToken.balanceOf(addr1.address);
      const burnAmount = balance + ethers.parseUnits("1", DECIMALS);
      
      await xfiToken.connect(addr1).approve(addr2.address, burnAmount);
      
      await expect(
        xfiToken.connect(addr2).burnFrom(addr1.address, burnAmount)
      ).to.be.revertedWithCustomError(xfiToken, "ERC20InsufficientBalance");
    });
  });

  describe("Standard ERC20 Functions", function () {
    it("Should handle transfers correctly", async function () {
      const transferAmount = ethers.parseUnits("1000", DECIMALS);
      
      await xfiToken.transfer(addr1.address, transferAmount);
      
      const balance = await xfiToken.balanceOf(addr1.address);
      expect(balance).to.equal(transferAmount);
    });

    it("Should handle approve and transferFrom correctly", async function () {
      const amount = ethers.parseUnits("1000", DECIMALS);
      
      await xfiToken.approve(addr1.address, amount);
      await xfiToken.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      
      const balance = await xfiToken.balanceOf(addr2.address);
      expect(balance).to.equal(amount);
    });

    it("Should return correct allowance", async function () {
      const amount = ethers.parseUnits("1000", DECIMALS);
      
      await xfiToken.approve(addr1.address, amount);
      
      const allowance = await xfiToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(amount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount minting", async function () {
      const initialBalance = await xfiToken.balanceOf(addr1.address);
      
      await xfiToken.mint(addr1.address, 0);
      
      const finalBalance = await xfiToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should handle zero amount burning", async function () {
      const initialBalance = await xfiToken.balanceOf(addr1.address);
      
      await xfiToken.connect(addr1).burn(0);
      
      const finalBalance = await xfiToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should handle large amounts", async function () {
      const largeAmount = ethers.parseUnits("1000000000", DECIMALS); // 1 billion
      
      await xfiToken.mint(addr1.address, largeAmount);
      
      const balance = await xfiToken.balanceOf(addr1.address);
      expect(balance).to.equal(largeAmount);
    });
  });
});