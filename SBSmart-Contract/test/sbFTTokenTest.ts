import { expect } from "chai";
import { ethers } from "hardhat";
import { SbFTToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SbFTToken", function () {
  let sbftToken: SbFTToken;
  let owner: SignerWithAddress;
  let stakingContract: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const TOKEN_NAME = "Stake and Bake Fractional Token";
  const TOKEN_SYMBOL = "sbFT";
  const DECIMALS = 18;

  beforeEach(async function () {
    [owner, stakingContract, addr1, addr2] = await ethers.getSigners();

    const SbFTTokenFactory = await ethers.getContractFactory("SbFTToken");
    sbftToken = await SbFTTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sbftToken.owner()).to.equal(owner.address);
    });

    it("Should have zero initial supply", async function () {
      expect(await sbftToken.totalSupply()).to.equal(0);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await sbftToken.name()).to.equal(TOKEN_NAME);
      expect(await sbftToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the correct decimals", async function () {
      expect(await sbftToken.decimals()).to.equal(DECIMALS);
    });

    it("Should have no staking contract set initially", async function () {
      expect(await sbftToken.stakingContract()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Staking Contract Management", function () {
    it("Should allow owner to set staking contract", async function () {
      await sbftToken.setStakingContract(stakingContract.address);
      expect(await sbftToken.stakingContract()).to.equal(stakingContract.address);
    });

    it("Should emit StakingContractSet event", async function () {
      await expect(sbftToken.setStakingContract(stakingContract.address))
        .to.emit(sbftToken, "StakingContractSet")
        .withArgs(stakingContract.address);
    });

    it("Should revert if non-owner tries to set staking contract", async function () {
      await expect(
        sbftToken.connect(addr1).setStakingContract(stakingContract.address)
      ).to.be.revertedWithCustomError(sbftToken, "OwnableUnauthorizedAccount");
    });

    it("Should revert if trying to set zero address as staking contract", async function () {
      await expect(
        sbftToken.setStakingContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid staking contract");
    });

    it("Should allow owner to change staking contract", async function () {
      await sbftToken.setStakingContract(stakingContract.address);
      await sbftToken.setStakingContract(addr1.address);
      expect(await sbftToken.stakingContract()).to.equal(addr1.address);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await sbftToken.setStakingContract(stakingContract.address);
    });

    it("Should allow staking contract to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      const balance = await sbftToken.balanceOf(addr1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should increase total supply when minting", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      const initialSupply = await sbftToken.totalSupply();
      
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      const finalSupply = await sbftToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply + mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(sbftToken.connect(stakingContract).mint(addr1.address, mintAmount))
        .to.emit(sbftToken, "TokensMinted")
        .withArgs(addr1.address, mintAmount, mintAmount);
    });

    it("Should revert if non-staking contract tries to mint", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(
        sbftToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWith("Only staking contract can mint");
    });

    it("Should revert if trying to mint to zero address", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(
        sbftToken.connect(stakingContract).mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should revert if trying to mint zero amount", async function () {
      await expect(
        sbftToken.connect(stakingContract).mint(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should allow multiple mints to same address", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      const balance = await sbftToken.balanceOf(addr1.address);
      expect(balance).to.equal(mintAmount * 2n);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await sbftToken.setStakingContract(stakingContract.address);
      // Mint some tokens first
      const mintAmount = ethers.parseUnits("10000", DECIMALS);
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
    });

    it("Should allow staking contract to burn tokens", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const initialBalance = await sbftToken.balanceOf(addr1.address);
      
      await sbftToken.connect(stakingContract).burn(addr1.address, burnAmount);
      
      const finalBalance = await sbftToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should decrease total supply when burning", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const initialSupply = await sbftToken.totalSupply();
      
      await sbftToken.connect(stakingContract).burn(addr1.address, burnAmount);
      
      const finalSupply = await sbftToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply - burnAmount);
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      const expectedSupply = (await sbftToken.totalSupply()) - burnAmount;
      
      await expect(sbftToken.connect(stakingContract).burn(addr1.address, burnAmount))
        .to.emit(sbftToken, "TokensBurned")
        .withArgs(addr1.address, burnAmount, expectedSupply);
    });

    it("Should revert if non-staking contract tries to burn", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(
        sbftToken.connect(addr1).burn(addr1.address, burnAmount)
      ).to.be.revertedWith("Only staking contract can burn");
    });

    it("Should revert if trying to burn from zero address", async function () {
      const burnAmount = ethers.parseUnits("1000", DECIMALS);
      
      await expect(
        sbftToken.connect(stakingContract).burn(ethers.ZeroAddress, burnAmount)
      ).to.be.revertedWith("Cannot burn from zero address");
    });

    it("Should revert if trying to burn zero amount", async function () {
      await expect(
        sbftToken.connect(stakingContract).burn(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert if trying to burn more than balance", async function () {
      const balance = await sbftToken.balanceOf(addr1.address);
      const burnAmount = balance + ethers.parseUnits("1", DECIMALS);
      
      await expect(
        sbftToken.connect(stakingContract).burn(addr1.address, burnAmount)
      ).to.be.revertedWith("Insufficient balance to burn");
    });

    it("Should allow burning entire balance", async function () {
      const balance = await sbftToken.balanceOf(addr1.address);
      
      await sbftToken.connect(stakingContract).burn(addr1.address, balance);
      
      const finalBalance = await sbftToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(0);
    });
  });

  describe("Holder Management", function () {
    beforeEach(async function () {
      await sbftToken.setStakingContract(stakingContract.address);
    });

    it("Should return empty array for getHolders (simplified implementation)", async function () {
      const holders = await sbftToken.getHolders();
      expect(holders).to.be.an('array');
      expect(holders.length).to.equal(0);
    });

    it("Should return false for non-holders", async function () {
      const isHolder = await sbftToken.isHolder(addr1.address);
      expect(isHolder).to.be.false;
    });

    it("Should return true for holders", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      const isHolder = await sbftToken.isHolder(addr1.address);
      expect(isHolder).to.be.true;
    });

    it("Should return false after burning all tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      await sbftToken.connect(stakingContract).burn(addr1.address, mintAmount);
      
      const isHolder = await sbftToken.isHolder(addr1.address);
      expect(isHolder).to.be.false;
    });
  });

  describe("Standard ERC20 Functions", function () {
    beforeEach(async function () {
      await sbftToken.setStakingContract(stakingContract.address);
      // Mint some tokens to addr1
      const mintAmount = ethers.parseUnits("10000", DECIMALS);
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
    });

    it("Should handle transfers correctly", async function () {
      const transferAmount = ethers.parseUnits("1000", DECIMALS);
      
      await sbftToken.connect(addr1).transfer(addr2.address, transferAmount);
      
      const balance = await sbftToken.balanceOf(addr2.address);
      expect(balance).to.equal(transferAmount);
    });

    it("Should handle approve and transferFrom correctly", async function () {
      const amount = ethers.parseUnits("1000", DECIMALS);
      
      await sbftToken.connect(addr1).approve(addr2.address, amount);
      await sbftToken.connect(addr2).transferFrom(addr1.address, addr2.address, amount);
      
      const balance = await sbftToken.balanceOf(addr2.address);
      expect(balance).to.equal(amount);
    });

    it("Should return correct allowance", async function () {
      const amount = ethers.parseUnits("1000", DECIMALS);
      
      await sbftToken.connect(addr1).approve(addr2.address, amount);
      
      const allowance = await sbftToken.allowance(addr1.address, addr2.address);
      expect(allowance).to.equal(amount);
    });
  });

  describe("Integration Scenarios", function () {
    beforeEach(async function () {
      await sbftToken.setStakingContract(stakingContract.address);
    });

    it("Should handle multiple users minting and burning", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      // Mint to multiple users
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      await sbftToken.connect(stakingContract).mint(addr2.address, mintAmount);
      
      expect(await sbftToken.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await sbftToken.balanceOf(addr2.address)).to.equal(mintAmount);
      expect(await sbftToken.totalSupply()).to.equal(mintAmount * 2n);
      
      // Burn from one user
      await sbftToken.connect(stakingContract).burn(addr1.address, mintAmount / 2n);
      
      expect(await sbftToken.balanceOf(addr1.address)).to.equal(mintAmount / 2n);
      expect(await sbftToken.totalSupply()).to.equal(mintAmount + mintAmount / 2n);
    });

    it("Should maintain correct state after staking contract change", async function () {
      const mintAmount = ethers.parseUnits("1000", DECIMALS);
      
      // Mint with first staking contract
      await sbftToken.connect(stakingContract).mint(addr1.address, mintAmount);
      
      // Change staking contract
      await sbftToken.setStakingContract(addr2.address);
      
      // Old staking contract should not be able to mint/burn
      await expect(
        sbftToken.connect(stakingContract).mint(addr1.address, mintAmount)
      ).to.be.revertedWith("Only staking contract can mint");
      
      // New staking contract should be able to mint/burn
      await sbftToken.connect(addr2).mint(addr1.address, mintAmount);
      expect(await sbftToken.balanceOf(addr1.address)).to.equal(mintAmount * 2n);
    });
  });
});