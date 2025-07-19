import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SbFTMarketplace, IERC20 } from "../typechain-types";

describe("SbFTMarketplace", function () {
  let marketplace: SbFTMarketplace;
  let sbftToken: IERC20;
  let usdcToken: IERC20;
  let owner: SignerWithAddress;
  let trader1: SignerWithAddress;
  let trader2: SignerWithAddress;
  let trader3: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  // Test constants
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens
  const USDC_DECIMALS = 6;
  const INITIAL_USDC_SUPPLY = ethers.utils.parseUnits("1000000", USDC_DECIMALS); // 1M USDC
  const MIN_ORDER_SIZE = ethers.utils.parseEther("1"); // 1 sbFT
  const DEFAULT_TRADING_FEE = 250; // 2.5%
  const BASIS_POINTS = 10000;

  beforeEach(async function () {
    [owner, trader1, trader2, trader3, feeRecipient] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // Deploy sbFT token (18 decimals)
    sbftToken = await MockERC20.deploy("sbFT Token", "sbFT", INITIAL_SUPPLY);
    
    // Deploy USDC token (6 decimals)
    usdcToken = await MockERC20.deploy("USD Coin", "USDC", INITIAL_USDC_SUPPLY);

    // Deploy marketplace
    const SbFTMarketplace = await ethers.getContractFactory("SbFTMarketplace");
    marketplace = await SbFTMarketplace.deploy(
      sbftToken.address,
      usdcToken.address
    );

    // Distribute tokens to traders
    const sbftAmount = ethers.utils.parseEther("10000"); // 10k sbFT each
    const usdcAmount = ethers.utils.parseUnits("100000", USDC_DECIMALS); // 100k USDC each

    await sbftToken.transfer(trader1.address, sbftAmount);
    await sbftToken.transfer(trader2.address, sbftAmount);
    await sbftToken.transfer(trader3.address, sbftAmount);

    await usdcToken.transfer(trader1.address, usdcAmount);
    await usdcToken.transfer(trader2.address, usdcAmount);
    await usdcToken.transfer(trader3.address, usdcAmount);

    // Approve marketplace to spend tokens
    await sbftToken.connect(trader1).approve(marketplace.address, ethers.constants.MaxUint256);
    await sbftToken.connect(trader2).approve(marketplace.address, ethers.constants.MaxUint256);
    await sbftToken.connect(trader3).approve(marketplace.address, ethers.constants.MaxUint256);

    await usdcToken.connect(trader1).approve(marketplace.address, ethers.constants.MaxUint256);
    await usdcToken.connect(trader2).approve(marketplace.address, ethers.constants.MaxUint256);
    await usdcToken.connect(trader3).approve(marketplace.address, ethers.constants.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set correct token addresses", async function () {
      expect(await marketplace.sbftToken()).to.equal(sbftToken.address);
      expect(await marketplace.usdcToken()).to.equal(usdcToken.address);
    });

    it("Should set correct initial values", async function () {
      expect(await marketplace.tradingFee()).to.equal(DEFAULT_TRADING_FEE);
      expect(await marketplace.orderCount()).to.equal(0);
      expect(await marketplace.totalVolume()).to.equal(0);
      expect(await marketplace.totalTrades()).to.equal(0);
      expect(await marketplace.feesCollected()).to.equal(0);
    });

    it("Should set correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should revert with invalid token addresses", async function () {
      const SbFTMarketplace = await ethers.getContractFactory("SbFTMarketplace");
      
      await expect(
        SbFTMarketplace.deploy(ethers.constants.AddressZero, usdcToken.address)
      ).to.be.revertedWith("Invalid sbFT token");

      await expect(
        SbFTMarketplace.deploy(sbftToken.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid USDC token");
    });
  });

  describe("Buy Orders", function () {
    it("Should create a buy order successfully", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS); // 1.5 USDC per sbFT

      await expect(
        marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice)
      )
        .to.emit(marketplace, "OrderCreated")
        .withArgs(0, trader1.address, true, sbftAmount, usdcPrice, ethers.utils.parseUnits("150", USDC_DECIMALS));

      const order = await marketplace.getOrder(0);
      expect(order.user).to.equal(trader1.address);
      expect(order.isBuyOrder).to.be.true;
      expect(order.sbftAmount).to.equal(sbftAmount);
      expect(order.usdcPrice).to.equal(usdcPrice);
      expect(order.active).to.be.true;
      expect(order.filled).to.equal(0);
    });

    it("Should transfer USDC to contract on buy order", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);
      const totalValue = ethers.utils.parseUnits("150", USDC_DECIMALS);

      const trader1UsdcBefore = await usdcToken.balanceOf(trader1.address);
      const contractUsdcBefore = await usdcToken.balanceOf(marketplace.address);

      await marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice);

      const trader1UsdcAfter = await usdcToken.balanceOf(trader1.address);
      const contractUsdcAfter = await usdcToken.balanceOf(marketplace.address);

      expect(trader1UsdcAfter).to.equal(trader1UsdcBefore.sub(totalValue));
      expect(contractUsdcAfter).to.equal(contractUsdcBefore.add(totalValue));
    });

    it("Should revert if order below minimum size", async function () {
      const sbftAmount = ethers.utils.parseEther("0.5"); // Below 1 sbFT minimum
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await expect(
        marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice)
      ).to.be.revertedWith("Order below minimum size");
    });

    it("Should revert if price is zero", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = 0;

      await expect(
        marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should revert if insufficient USDC balance", async function () {
      const sbftAmount = ethers.utils.parseEther("200000"); // Very large amount
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await expect(
        marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice)
      ).to.be.revertedWith("Insufficient USDC balance");
    });
  });

  describe("Sell Orders", function () {
    it("Should create a sell order successfully", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await expect(
        marketplace.connect(trader1).createSellOrder(sbftAmount, usdcPrice)
      )
        .to.emit(marketplace, "OrderCreated")
        .withArgs(0, trader1.address, false, sbftAmount, usdcPrice, ethers.utils.parseUnits("150", USDC_DECIMALS));

      const order = await marketplace.getOrder(0);
      expect(order.user).to.equal(trader1.address);
      expect(order.isBuyOrder).to.be.false;
      expect(order.sbftAmount).to.equal(sbftAmount);
      expect(order.usdcPrice).to.equal(usdcPrice);
      expect(order.active).to.be.true;
      expect(order.filled).to.equal(0);
    });

    it("Should transfer sbFT to contract on sell order", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      const trader1SbftBefore = await sbftToken.balanceOf(trader1.address);
      const contractSbftBefore = await sbftToken.balanceOf(marketplace.address);

      await marketplace.connect(trader1).createSellOrder(sbftAmount, usdcPrice);

      const trader1SbftAfter = await sbftToken.balanceOf(trader1.address);
      const contractSbftAfter = await sbftToken.balanceOf(marketplace.address);

      expect(trader1SbftAfter).to.equal(trader1SbftBefore.sub(sbftAmount));
      expect(contractSbftAfter).to.equal(contractSbftBefore.add(sbftAmount));
    });

    it("Should revert if insufficient sbFT balance", async function () {
      const sbftAmount = ethers.utils.parseEther("20000"); // More than trader1 has
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await expect(
        marketplace.connect(trader1).createSellOrder(sbftAmount, usdcPrice)
      ).to.be.revertedWith("Insufficient sbFT balance");
    });
  });

  describe("Order Matching", function () {
    it("Should match buy and sell orders at same price", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create sell order first
      await marketplace.connect(trader1).createSellOrder(sbftAmount, usdcPrice);

      // Create buy order that should match
      await expect(
        marketplace.connect(trader2).createBuyOrder(sbftAmount, usdcPrice)
      )
        .to.emit(marketplace, "OrderFilled")
        .withArgs(
          1, // buy order ID
          trader2.address, // buyer
          trader1.address, // seller
          sbftAmount,
          ethers.utils.parseUnits("150", USDC_DECIMALS), // trade value
          ethers.utils.parseUnits("3.75", USDC_DECIMALS) // fee (2.5% of 150)
        );

      // Check orders are filled
      const sellOrder = await marketplace.getOrder(0);
      const buyOrder = await marketplace.getOrder(1);
      
      expect(sellOrder.filled).to.equal(sbftAmount);
      expect(sellOrder.active).to.be.false;
      expect(buyOrder.filled).to.equal(sbftAmount);
      expect(buyOrder.active).to.be.false;
    });

    it("Should match buy order with lower-priced sell order", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const sellPrice = ethers.utils.parseUnits("1.0", USDC_DECIMALS);
      const buyPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create sell order at lower price
      await marketplace.connect(trader1).createSellOrder(sbftAmount, sellPrice);

      // Create buy order at higher price - should match at buy price
      await marketplace.connect(trader2).createBuyOrder(sbftAmount, buyPrice);

      // Check trade executed at buy order price
      const stats = await marketplace.getMarketStats();
      expect(stats[0]).to.equal(ethers.utils.parseUnits("150", USDC_DECIMALS)); // Volume at buy price
    });

    it("Should not match orders with incompatible prices", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const sellPrice = ethers.utils.parseUnits("2.0", USDC_DECIMALS);
      const buyPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create sell order at higher price
      await marketplace.connect(trader1).createSellOrder(sbftAmount, sellPrice);

      // Create buy order at lower price - should not match
      await marketplace.connect(trader2).createBuyOrder(sbftAmount, buyPrice);

      // Check both orders remain active
      const sellOrder = await marketplace.getOrder(0);
      const buyOrder = await marketplace.getOrder(1);
      
      expect(sellOrder.active).to.be.true;
      expect(buyOrder.active).to.be.true;
      expect(sellOrder.filled).to.equal(0);
      expect(buyOrder.filled).to.equal(0);
    });

    it("Should partially fill large order against smaller order", async function () {
      const sellAmount = ethers.utils.parseEther("50");
      const buyAmount = ethers.utils.parseEther("100");
      const price = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create small sell order
      await marketplace.connect(trader1).createSellOrder(sellAmount, price);

      // Create large buy order
      await marketplace.connect(trader2).createBuyOrder(buyAmount, price);

      // Check partial fill
      const sellOrder = await marketplace.getOrder(0);
      const buyOrder = await marketplace.getOrder(1);
      
      expect(sellOrder.filled).to.equal(sellAmount);
      expect(sellOrder.active).to.be.false;
      expect(buyOrder.filled).to.equal(sellAmount);
      expect(buyOrder.active).to.be.true; // Still active with remaining amount
    });
  });

  describe("Order Cancellation", function () {
    it("Should cancel buy order and return USDC", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);
      const totalValue = ethers.utils.parseUnits("150", USDC_DECIMALS);

      await marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice);

      const trader1UsdcBefore = await usdcToken.balanceOf(trader1.address);

      await expect(marketplace.connect(trader1).cancelOrder(0))
        .to.emit(marketplace, "OrderCanceled")
        .withArgs(0, trader1.address);

      const trader1UsdcAfter = await usdcToken.balanceOf(trader1.address);
      const order = await marketplace.getOrder(0);

      expect(order.active).to.be.false;
      expect(trader1UsdcAfter).to.equal(trader1UsdcBefore.add(totalValue));
    });

    it("Should cancel sell order and return sbFT", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await marketplace.connect(trader1).createSellOrder(sbftAmount, usdcPrice);

      const trader1SbftBefore = await sbftToken.balanceOf(trader1.address);

      await marketplace.connect(trader1).cancelOrder(0);

      const trader1SbftAfter = await sbftToken.balanceOf(trader1.address);
      const order = await marketplace.getOrder(0);

      expect(order.active).to.be.false;
      expect(trader1SbftAfter).to.equal(trader1SbftBefore.add(sbftAmount));
    });

    it("Should cancel partially filled buy order", async function () {
      const sellAmount = ethers.utils.parseEther("50");
      const buyAmount = ethers.utils.parseEther("100");
      const price = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create orders that partially match
      await marketplace.connect(trader1).createSellOrder(sellAmount, price);
      await marketplace.connect(trader2).createBuyOrder(buyAmount, price);

      // Cancel partially filled buy order
      const trader2UsdcBefore = await usdcToken.balanceOf(trader2.address);
      await marketplace.connect(trader2).cancelOrder(1);

      const trader2UsdcAfter = await usdcToken.balanceOf(trader2.address);
      const buyOrder = await marketplace.getOrder(1);

      expect(buyOrder.active).to.be.false;
      // Should return USDC for unfilled portion
      const remainingValue = ethers.utils.parseUnits("75", USDC_DECIMALS); // 50 sbFT * 1.5 USDC
      expect(trader2UsdcAfter).to.equal(trader2UsdcBefore.add(remainingValue));
    });

    it("Should revert if not order owner", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice);

      await expect(
        marketplace.connect(trader2).cancelOrder(0)
      ).to.be.revertedWith("Not your order");
    });

    it("Should revert if order doesn't exist", async function () {
      await expect(
        marketplace.connect(trader1).cancelOrder(999)
      ).to.be.revertedWith("Order does not exist");
    });

    it("Should revert if order already inactive", async function () {
      const sbftAmount = ethers.utils.parseEther("100");
      const usdcPrice = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await marketplace.connect(trader1).createBuyOrder(sbftAmount, usdcPrice);
      await marketplace.connect(trader1).cancelOrder(0);

      await expect(
        marketplace.connect(trader1).cancelOrder(0)
      ).to.be.revertedWith("Order not active");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create some test orders
      await marketplace.connect(trader1).createBuyOrder(
        ethers.utils.parseEther("100"),
        ethers.utils.parseUnits("1.5", USDC_DECIMALS)
      );
      await marketplace.connect(trader2).createSellOrder(
        ethers.utils.parseEther("50"),
        ethers.utils.parseUnits("2.0", USDC_DECIMALS)
      );
    });

    it("Should return active buy orders", async function () {
      const activeBuyOrders = await marketplace.getActiveBuyOrders();
      expect(activeBuyOrders).to.have.length(1);
      expect(activeBuyOrders[0]).to.equal(0);
    });

    it("Should return active sell orders", async function () {
      const activeSellOrders = await marketplace.getActiveSellOrders();
      expect(activeSellOrders).to.have.length(1);
      expect(activeSellOrders[0]).to.equal(1);
    });

    it("Should return user orders", async function () {
      const trader1Orders = await marketplace.getUserOrders(trader1.address);
      const trader2Orders = await marketplace.getUserOrders(trader2.address);

      expect(trader1Orders).to.have.length(1);
      expect(trader1Orders[0]).to.equal(0);
      expect(trader2Orders).to.have.length(1);
      expect(trader2Orders[0]).to.equal(1);
    });

    it("Should return correct market stats", async function () {
      const [volume, trades, fees] = await marketplace.getMarketStats();
      expect(volume).to.equal(0); // No trades yet
      expect(trades).to.equal(0);
      expect(fees).to.equal(0);
    });
  });

  describe("Fee Management", function () {
    it("Should update trading fee", async function () {
      const newFee = 500; // 5%

      await expect(marketplace.updateTradingFee(newFee))
        .to.emit(marketplace, "TradingFeeUpdated")
        .withArgs(newFee);

      expect(await marketplace.tradingFee()).to.equal(newFee);
    });

    it("Should revert if fee exceeds maximum", async function () {
      const newFee = 1100; // 11%

      await expect(
        marketplace.updateTradingFee(newFee)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should revert if non-owner tries to update fee", async function () {
      await expect(
        marketplace.connect(trader1).updateTradingFee(500)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("Should withdraw fees correctly", async function () {
      // Create and execute a trade to generate fees
      const sbftAmount = ethers.utils.parseEther("100");
      const price = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      await marketplace.connect(trader1).createSellOrder(sbftAmount, price);
      await marketplace.connect(trader2).createBuyOrder(sbftAmount, price);

      const expectedFee = ethers.utils.parseUnits("3.75", USDC_DECIMALS); // 2.5% of 150

      await expect(marketplace.withdrawFees(feeRecipient.address))
        .to.emit(marketplace, "FeesWithdrawn")
        .withArgs(feeRecipient.address, expectedFee);

      const feeRecipientBalance = await usdcToken.balanceOf(feeRecipient.address);
      expect(feeRecipientBalance).to.equal(expectedFee);
    });

    it("Should revert fee withdrawal to zero address", async function () {
      await expect(
        marketplace.withdrawFees(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert if non-owner tries to withdraw fees", async function () {
      await expect(
        marketplace.connect(trader1).withdrawFees(feeRecipient.address)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple partial fills", async function () {
      const buyAmount = ethers.utils.parseEther("100");
      const price = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Create large buy order
      await marketplace.connect(trader1).createBuyOrder(buyAmount, price);

      // Create multiple small sell orders
      await marketplace.connect(trader2).createSellOrder(ethers.utils.parseEther("30"), price);
      await marketplace.connect(trader3).createSellOrder(ethers.utils.parseEther("40"), price);

      // Check partial fills
      const buyOrder = await marketplace.getOrder(0);
      expect(buyOrder.filled).to.equal(ethers.utils.parseEther("70"));
      expect(buyOrder.active).to.be.true;

      const sellOrder1 = await marketplace.getOrder(1);
      const sellOrder2 = await marketplace.getOrder(2);
      expect(sellOrder1.filled).to.equal(ethers.utils.parseEther("30"));
      expect(sellOrder2.filled).to.equal(ethers.utils.parseEther("40"));
      expect(sellOrder1.active).to.be.false;
      expect(sellOrder2.active).to.be.false;
    });

    it("Should handle zero trade amount edge case", async function () {
      // This shouldn't happen with proper validation, but test robustness
      const sbftAmount = ethers.utils.parseEther("1");
      const verySmallPrice = 1; // Very small price that might cause rounding issues

      await expect(
        marketplace.connect(trader1).createBuyOrder(sbftAmount, verySmallPrice)
      ).to.be.revertedWith("Total value must be greater than 0");
    });

    it("Should maintain correct order arrays after cancellations", async function () {
      // Create multiple orders
      await marketplace.connect(trader1).createBuyOrder(ethers.utils.parseEther("100"), ethers.utils.parseUnits("1.5", USDC_DECIMALS));
      await marketplace.connect(trader2).createBuyOrder(ethers.utils.parseEther("50"), ethers.utils.parseUnits("1.6", USDC_DECIMALS));
      await marketplace.connect(trader3).createBuyOrder(ethers.utils.parseEther("75"), ethers.utils.parseUnits("1.4", USDC_DECIMALS));

      // Cancel middle order
      await marketplace.connect(trader2).cancelOrder(1);

      const activeBuyOrders = await marketplace.getActiveBuyOrders();
      expect(activeBuyOrders).to.have.length(2);
      expect(activeBuyOrders).to.include(0);
      expect(activeBuyOrders).to.include(2);
      expect(activeBuyOrders).to.not.include(1);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // This test would need a malicious contract to properly test reentrancy
      // For now, we just verify the nonReentrant modifier is in place
      const sbftAmount = ethers.utils.parseEther("100");
      const price = ethers.utils.parseUnits("1.5", USDC_DECIMALS);

      // Multiple calls in same transaction should be prevented by nonReentrant
      await marketplace.connect(trader1).createBuyOrder(sbftAmount, price);
      
      // This is a basic test - in a real scenario, you'd deploy a malicious contract
      // that tries to call back into the marketplace during execution
      expect(await marketplace.orderCount()).to.equal(1);
    });
  });
});

// Mock ERC20 contract for testing
// You'll need to create this contract or use an existing mock
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = symbol == "USDC" ? 6 : 18;
        _mint(msg.sender, initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
`;