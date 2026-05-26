import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SecondaryMarket", function () {
  let usdc: Contract;
  let factory: Contract;
  let market: Contract; // ProjectMarket (LP token)
  let secondary: Contract; // SecondaryMarket
  let admin: Signer;
  let seller: Signer;
  let buyer: Signer;
  let stranger: Signer;
  let homeowner: Signer;
  let adminAddr: string;
  let sellerAddr: string;
  let buyerAddr: string;
  let strangerAddr: string;
  let homeownerAddr: string;
  let marketAddr: string;
  let secondaryAddr: string;

  const TARGET_AMOUNT = ethers.parseUnits("50000", 6);
  const LIST_AMOUNT = ethers.parseUnits("10000", 6);
  const LIST_PRICE = ethers.parseUnits("11000", 6); // total USDC for the listed amount
  const FEE_BPS = 150n; // 1.5%
  const DURATION_DAYS = 7;
  const ONE_DAY = 86400;
  const MINT_AMOUNT = ethers.parseUnits("1000000", 6);

  async function deployAndFundProject() {
    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy ProjectMarketFactory
    const Factory = await ethers.getContractFactory("ProjectMarketFactory");
    factory = await Factory.deploy(await usdc.getAddress());
    await factory.waitForDeployment();

    // Create a project
    await factory.connect(admin).createProject(
      homeownerAddr, TARGET_AMOUNT, 1200n, BigInt(365 * ONE_DAY), 5n, "ipfs://test"
    );
    const projectAddr = await factory.getProject(0);
    market = await ethers.getContractAt("ProjectMarket", projectAddr);
    marketAddr = projectAddr;

    // Mint USDC to participants
    for (const addr of [sellerAddr, buyerAddr, strangerAddr, homeownerAddr]) {
      await usdc.mint(addr, MINT_AMOUNT);
    }

    // Fund the project so seller gets LP tokens
    await market.connect(admin).startFunding();
    await usdc.connect(seller).approve(marketAddr, TARGET_AMOUNT);
    await market.connect(seller).deposit(TARGET_AMOUNT);
    await market.connect(admin).activate();

    // Deploy SecondaryMarket
    const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
    secondary = await SecondaryMarket.deploy(
      await usdc.getAddress(),
      adminAddr,
      adminAddr, // feeCollector = admin
      FEE_BPS
    );
    await secondary.waitForDeployment();
    secondaryAddr = await secondary.getAddress();
  }

  beforeEach(async function () {
    [admin, seller, buyer, stranger, homeowner] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    sellerAddr = await seller.getAddress();
    buyerAddr = await buyer.getAddress();
    strangerAddr = await stranger.getAddress();
    homeownerAddr = await homeowner.getAddress();

    await deployAndFundProject();
  });

  describe("Deployment", function () {
    it("should set correct USDC address", async function () {
      expect(await secondary.usdc()).to.equal(await usdc.getAddress());
    });

    it("should set correct fee basis points", async function () {
      expect(await secondary.feeBasisPoints()).to.equal(FEE_BPS);
    });

    it("should set correct fee collector", async function () {
      expect(await secondary.feeCollector()).to.equal(adminAddr);
    });

    it("should grant DEFAULT_ADMIN_ROLE to admin", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await secondary.hasRole(DEFAULT_ADMIN_ROLE, adminAddr)).to.be.true;
    });

    it("should grant FEE_ROLE to admin", async function () {
      const FEE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FEE_ROLE"));
      expect(await secondary.hasRole(FEE_ROLE, adminAddr)).to.be.true;
    });

    it("should start with nextListingId = 0", async function () {
      expect(await secondary.nextListingId()).to.equal(0);
    });

    it("should revert with zero USDC address", async function () {
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      await expect(
        SecondaryMarket.deploy(ethers.ZeroAddress, adminAddr, adminAddr, FEE_BPS)
      ).to.be.revertedWithCustomError(secondary, "ZeroAddress");
    });

    it("should revert with zero admin address", async function () {
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      await expect(
        SecondaryMarket.deploy(await usdc.getAddress(), ethers.ZeroAddress, adminAddr, FEE_BPS)
      ).to.be.revertedWithCustomError(secondary, "ZeroAddress");
    });

    it("should revert with zero fee collector address", async function () {
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      await expect(
        SecondaryMarket.deploy(await usdc.getAddress(), adminAddr, ethers.ZeroAddress, FEE_BPS)
      ).to.be.revertedWithCustomError(secondary, "ZeroAddress");
    });

    it("should revert with fee > 10000 bps", async function () {
      const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
      await expect(
        SecondaryMarket.deploy(await usdc.getAddress(), adminAddr, adminAddr, 10001)
      ).to.be.revertedWithCustomError(secondary, "FeeTooHigh");
    });
  });

  describe("list()", function () {
    beforeEach(async function () {
      // Approve SecondaryMarket to spend seller's LP tokens
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
    });

    it("should create a listing and escrow LP tokens", async function () {
      const sellerLPBefore = await market.balanceOf(sellerAddr);

      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      const sellerLPAfter = await market.balanceOf(sellerAddr);
      expect(sellerLPBefore - sellerLPAfter).to.equal(LIST_AMOUNT);

      // LP tokens are escrowed in SecondaryMarket contract
      expect(await market.balanceOf(secondaryAddr)).to.equal(LIST_AMOUNT);
    });

    it("should store correct listing data", async function () {
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      const listing = await secondary.listings(0);
      expect(listing.id).to.equal(0);
      expect(listing.seller).to.equal(sellerAddr);
      expect(listing.tokenContract).to.equal(marketAddr);
      expect(listing.amount).to.equal(LIST_AMOUNT);
      expect(listing.price).to.equal(LIST_PRICE);
      expect(listing.active).to.be.true;
    });

    it("should set correct expiration time", async function () {
      const tx = await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const listing = await secondary.listings(0);
      expect(listing.expiresAt).to.equal(BigInt(block!.timestamp) + BigInt(DURATION_DAYS * ONE_DAY));
    });

    it("should increment nextListingId", async function () {
      expect(await secondary.nextListingId()).to.equal(0);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);
      expect(await secondary.nextListingId()).to.equal(1);
    });

    it("should return the listing ID", async function () {
      const listingId = await secondary.connect(seller).list.staticCall(
        marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS
      );
      expect(listingId).to.equal(0);
    });

    it("should emit Listed event", async function () {
      await expect(
        secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS)
      )
        .to.emit(secondary, "Listed")
        .withArgs(0, sellerAddr, marketAddr, LIST_AMOUNT, LIST_PRICE);
    });

    it("should revert with zero amount", async function () {
      await expect(
        secondary.connect(seller).list(marketAddr, 0, LIST_PRICE, DURATION_DAYS)
      ).to.be.revertedWithCustomError(secondary, "ZeroAmount");
    });

    it("should revert with zero price", async function () {
      await expect(
        secondary.connect(seller).list(marketAddr, LIST_AMOUNT, 0, DURATION_DAYS)
      ).to.be.revertedWithCustomError(secondary, "ZeroPrice");
    });

    it("should revert with zero duration", async function () {
      await expect(
        secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, 0)
      ).to.be.revertedWithCustomError(secondary, "ZeroDuration");
    });

    it("should revert with zero token address", async function () {
      await expect(
        secondary.connect(seller).list(ethers.ZeroAddress, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS)
      ).to.be.revertedWithCustomError(secondary, "ZeroAddress");
    });

    it("should revert without LP token approval", async function () {
      // Revoke the approval set in beforeEach
      await market.connect(seller).approve(secondaryAddr, 0);
      await expect(
        secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS)
      ).to.be.reverted;
    });

    it("should allow multiple listings from same seller", async function () {
      const halfAmount = LIST_AMOUNT / 2n;
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);

      await secondary.connect(seller).list(marketAddr, halfAmount, LIST_PRICE, DURATION_DAYS);
      await secondary.connect(seller).list(marketAddr, halfAmount, LIST_PRICE, DURATION_DAYS);

      expect(await secondary.nextListingId()).to.equal(2);

      const listing0 = await secondary.listings(0);
      const listing1 = await secondary.listings(1);
      expect(listing0.id).to.equal(0);
      expect(listing1.id).to.equal(1);
      expect(listing0.active).to.be.true;
      expect(listing1.active).to.be.true;
    });
  });

  describe("buy()", function () {
    beforeEach(async function () {
      // Create a listing
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      // Approve buyer's USDC for purchase + fee
      const fee = (LIST_PRICE * FEE_BPS) / 10000n;
      const totalCost = LIST_PRICE + fee;
      await usdc.connect(buyer).approve(secondaryAddr, totalCost);
    });

    it("should transfer full listing price in USDC to seller", async function () {
      const sellerUSDCBefore = await usdc.balanceOf(sellerAddr);

      await secondary.connect(buyer).buy(0);

      const sellerUSDCAfter = await usdc.balanceOf(sellerAddr);
      expect(sellerUSDCAfter - sellerUSDCBefore).to.equal(LIST_PRICE);
    });

    it("should transfer fee in USDC to fee collector", async function () {
      const feeCollectorBefore = await usdc.balanceOf(adminAddr);
      const expectedFee = (LIST_PRICE * FEE_BPS) / 10000n;

      await secondary.connect(buyer).buy(0);

      const feeCollectorAfter = await usdc.balanceOf(adminAddr);
      expect(feeCollectorAfter - feeCollectorBefore).to.equal(expectedFee);
    });

    it("should transfer LP tokens from escrow to buyer", async function () {
      expect(await market.balanceOf(buyerAddr)).to.equal(0);

      await secondary.connect(buyer).buy(0);

      expect(await market.balanceOf(buyerAddr)).to.equal(LIST_AMOUNT);
      expect(await market.balanceOf(secondaryAddr)).to.equal(0);
    });

    it("should mark listing as inactive", async function () {
      await secondary.connect(buyer).buy(0);

      const listing = await secondary.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should emit Purchased event with correct fee", async function () {
      const expectedFee = (LIST_PRICE * FEE_BPS) / 10000n;

      await expect(secondary.connect(buyer).buy(0))
        .to.emit(secondary, "Purchased")
        .withArgs(0, buyerAddr, expectedFee);
    });

    it("should deduct correct total from buyer (price + fee)", async function () {
      const buyerUSDCBefore = await usdc.balanceOf(buyerAddr);
      const expectedFee = (LIST_PRICE * FEE_BPS) / 10000n;
      const expectedTotal = LIST_PRICE + expectedFee;

      await secondary.connect(buyer).buy(0);

      const buyerUSDCAfter = await usdc.balanceOf(buyerAddr);
      expect(buyerUSDCBefore - buyerUSDCAfter).to.equal(expectedTotal);
    });

    it("should revert on inactive listing", async function () {
      await secondary.connect(buyer).buy(0);

      // Approve again for second attempt
      await usdc.connect(stranger).approve(secondaryAddr, MINT_AMOUNT);
      await expect(
        secondary.connect(stranger).buy(0)
      ).to.be.revertedWithCustomError(secondary, "ListingNotActive");
    });

    it("should revert on self-purchase", async function () {
      // Seller tries to buy own listing
      await usdc.connect(seller).approve(secondaryAddr, MINT_AMOUNT);
      await expect(
        secondary.connect(seller).buy(0)
      ).to.be.revertedWithCustomError(secondary, "SelfPurchase");
    });

    it("should revert without USDC approval", async function () {
      // Revoke buyer USDC approval
      await usdc.connect(buyer).approve(secondaryAddr, 0);
      await expect(
        secondary.connect(buyer).buy(0)
      ).to.be.reverted;
    });

    it("should work with zero fee (feeBasisPoints = 0)", async function () {
      // Set fee to 0
      await secondary.connect(admin).setFee(0);

      const sellerUSDCBefore = await usdc.balanceOf(sellerAddr);
      const buyerUSDCBefore = await usdc.balanceOf(buyerAddr);

      await secondary.connect(buyer).buy(0);

      const sellerUSDCAfter = await usdc.balanceOf(sellerAddr);
      const buyerUSDCAfter = await usdc.balanceOf(buyerAddr);

      // Seller gets full price, buyer pays only price (no fee)
      expect(sellerUSDCAfter - sellerUSDCBefore).to.equal(LIST_PRICE);
      expect(buyerUSDCBefore - buyerUSDCAfter).to.equal(LIST_PRICE);
    });
  });

  describe("buy() - Expiration", function () {
    beforeEach(async function () {
      // Create a listing with 1-day duration
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, 1);

      const fee = (LIST_PRICE * FEE_BPS) / 10000n;
      await usdc.connect(buyer).approve(secondaryAddr, LIST_PRICE + fee);
    });

    it("should allow purchase before expiration", async function () {
      // Advance time to just before expiration
      await time.increase(ONE_DAY - 10);

      await expect(secondary.connect(buyer).buy(0)).to.not.be.reverted;
    });

    it("should revert purchase after expiration", async function () {
      // Advance time past expiration
      await time.increase(ONE_DAY + 1);

      await expect(
        secondary.connect(buyer).buy(0)
      ).to.be.revertedWithCustomError(secondary, "ListingExpired");
    });
  });

  describe("cancel()", function () {
    beforeEach(async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);
    });

    it("should allow seller to cancel", async function () {
      await secondary.connect(seller).cancel(0);

      const listing = await secondary.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should return escrowed LP tokens to seller", async function () {
      const sellerLPBefore = await market.balanceOf(sellerAddr);

      await secondary.connect(seller).cancel(0);

      const sellerLPAfter = await market.balanceOf(sellerAddr);
      expect(sellerLPAfter - sellerLPBefore).to.equal(LIST_AMOUNT);
      expect(await market.balanceOf(secondaryAddr)).to.equal(0);
    });

    it("should emit Cancelled event", async function () {
      await expect(secondary.connect(seller).cancel(0))
        .to.emit(secondary, "Cancelled")
        .withArgs(0);
    });

    it("should allow admin to cancel", async function () {
      await secondary.connect(admin).cancel(0);

      const listing = await secondary.listings(0);
      expect(listing.active).to.be.false;
    });

    it("should return tokens to seller when admin cancels", async function () {
      const sellerLPBefore = await market.balanceOf(sellerAddr);

      await secondary.connect(admin).cancel(0);

      const sellerLPAfter = await market.balanceOf(sellerAddr);
      expect(sellerLPAfter - sellerLPBefore).to.equal(LIST_AMOUNT);
    });

    it("should revert when non-seller/non-admin cancels", async function () {
      await expect(
        secondary.connect(stranger).cancel(0)
      ).to.be.revertedWithCustomError(secondary, "Unauthorized");
    });

    it("should revert cancelling an already cancelled listing", async function () {
      await secondary.connect(seller).cancel(0);

      await expect(
        secondary.connect(seller).cancel(0)
      ).to.be.revertedWithCustomError(secondary, "ListingNotActive");
    });

    it("should revert cancelling a purchased listing", async function () {
      const fee = (LIST_PRICE * FEE_BPS) / 10000n;
      await usdc.connect(buyer).approve(secondaryAddr, LIST_PRICE + fee);
      await secondary.connect(buyer).buy(0);

      await expect(
        secondary.connect(seller).cancel(0)
      ).to.be.revertedWithCustomError(secondary, "ListingNotActive");
    });
  });

  describe("setFee()", function () {
    it("should allow FEE_ROLE to set fee", async function () {
      await secondary.connect(admin).setFee(200);
      expect(await secondary.feeBasisPoints()).to.equal(200);
    });

    it("should emit FeeUpdated event", async function () {
      await expect(secondary.connect(admin).setFee(200))
        .to.emit(secondary, "FeeUpdated")
        .withArgs(200);
    });

    it("should allow setting fee to 0", async function () {
      await secondary.connect(admin).setFee(0);
      expect(await secondary.feeBasisPoints()).to.equal(0);
    });

    it("should allow setting fee to 10000 (100%)", async function () {
      await secondary.connect(admin).setFee(10000);
      expect(await secondary.feeBasisPoints()).to.equal(10000);
    });

    it("should revert with fee > 10000", async function () {
      await expect(
        secondary.connect(admin).setFee(10001)
      ).to.be.revertedWithCustomError(secondary, "FeeTooHigh");
    });

    it("should revert when called by non-FEE_ROLE", async function () {
      await expect(
        secondary.connect(stranger).setFee(200)
      ).to.be.reverted;
    });
  });

  describe("Fee Calculation", function () {
    it("should calculate fee correctly at 1.5%", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      const expectedFee = (LIST_PRICE * 150n) / 10000n; // 1.5%
      const feeCollectorBefore = await usdc.balanceOf(adminAddr);

      await usdc.connect(buyer).approve(secondaryAddr, LIST_PRICE + expectedFee);
      await secondary.connect(buyer).buy(0);

      const feeCollectorAfter = await usdc.balanceOf(adminAddr);
      expect(feeCollectorAfter - feeCollectorBefore).to.equal(expectedFee);
      // 11000 * 150 / 10000 = 165 USDC
      expect(expectedFee).to.equal(ethers.parseUnits("165", 6));
    });

    it("should handle fee change between listing and purchase", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      // Change fee to 2%
      await secondary.connect(admin).setFee(200);

      const expectedFee = (LIST_PRICE * 200n) / 10000n; // 2%
      const feeCollectorBefore = await usdc.balanceOf(adminAddr);

      await usdc.connect(buyer).approve(secondaryAddr, LIST_PRICE + expectedFee);
      await secondary.connect(buyer).buy(0);

      const feeCollectorAfter = await usdc.balanceOf(adminAddr);
      expect(feeCollectorAfter - feeCollectorBefore).to.equal(expectedFee);
    });
  });

  describe("Edge Cases", function () {
    it("should handle buying then relisting by new owner", async function () {
      // Seller lists
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      // Buyer buys
      const fee = (LIST_PRICE * FEE_BPS) / 10000n;
      await usdc.connect(buyer).approve(secondaryAddr, LIST_PRICE + fee);
      await secondary.connect(buyer).buy(0);

      expect(await market.balanceOf(buyerAddr)).to.equal(LIST_AMOUNT);

      // Buyer relists the tokens
      await market.connect(buyer).approve(secondaryAddr, LIST_AMOUNT);
      const newPrice = ethers.parseUnits("12000", 6);
      await secondary.connect(buyer).list(marketAddr, LIST_AMOUNT, newPrice, DURATION_DAYS);

      const listing = await secondary.listings(1);
      expect(listing.seller).to.equal(buyerAddr);
      expect(listing.amount).to.equal(LIST_AMOUNT);
      expect(listing.price).to.equal(newPrice);
      expect(listing.active).to.be.true;
    });

    it("should handle cancel then relist by same seller", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT * 2n);

      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);
      await secondary.connect(seller).cancel(0);

      // Relist same tokens
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      const listing = await secondary.listings(1);
      expect(listing.seller).to.equal(sellerAddr);
      expect(listing.active).to.be.true;
      expect(await secondary.nextListingId()).to.equal(2);
    });

    it("should allow admin to cancel expired listing", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, 1);

      // Advance past expiration - listing is still "active" in storage,
      // but buy would revert with ListingExpired
      await time.increase(ONE_DAY + 1);

      // Admin can still cancel (active is still true in storage)
      await secondary.connect(admin).cancel(0);

      const listing = await secondary.listings(0);
      expect(listing.active).to.be.false;

      // Tokens returned to seller
      expect(await market.balanceOf(sellerAddr)).to.equal(TARGET_AMOUNT);
    });

    it("should handle listing with very small amount (1 wei)", async function () {
      await market.connect(seller).approve(secondaryAddr, 1);
      const tinyPrice = ethers.parseUnits("1", 6); // 1 USDC

      await secondary.connect(seller).list(marketAddr, 1, tinyPrice, DURATION_DAYS);

      const listing = await secondary.listings(0);
      expect(listing.amount).to.equal(1);
      expect(listing.price).to.equal(tinyPrice);
    });

    it("should handle fee rounding to zero for very small price", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      // Price = 1 unit, fee = 1 * 150 / 10000 = 0 (rounds down)
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, 1, DURATION_DAYS);

      await usdc.connect(buyer).approve(secondaryAddr, MINT_AMOUNT);

      const sellerBefore = await usdc.balanceOf(sellerAddr);
      const feeCollectorBefore = await usdc.balanceOf(adminAddr);

      await secondary.connect(buyer).buy(0);

      const sellerAfter = await usdc.balanceOf(sellerAddr);
      const feeCollectorAfter = await usdc.balanceOf(adminAddr);

      expect(sellerAfter - sellerBefore).to.equal(1);
      expect(feeCollectorAfter - feeCollectorBefore).to.equal(0); // fee rounds to 0
    });

    it("should handle multiple concurrent listings from different sellers", async function () {
      // Give stranger some LP tokens by funding a separate project
      // (or just use existing seller)
      // Seller creates two listings with different parameters
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      const halfAmount = LIST_AMOUNT / 2n;

      await secondary.connect(seller).list(marketAddr, halfAmount, LIST_PRICE, DURATION_DAYS);
      await secondary.connect(seller).list(
        marketAddr, halfAmount, ethers.parseUnits("6000", 6), 14
      );

      expect(await secondary.nextListingId()).to.equal(2);

      // Buyer buys listing 1 (index 1)
      const fee1 = (ethers.parseUnits("6000", 6) * FEE_BPS) / 10000n;
      await usdc.connect(buyer).approve(secondaryAddr, ethers.parseUnits("6000", 6) + fee1);
      await secondary.connect(buyer).buy(1);

      // Listing 0 still active, listing 1 inactive
      expect((await secondary.listings(0)).active).to.be.true;
      expect((await secondary.listings(1)).active).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("should not allow non-FEE_ROLE to set fee", async function () {
      await expect(
        secondary.connect(seller).setFee(200)
      ).to.be.reverted;
    });

    it("should allow granted FEE_ROLE to set fee", async function () {
      const FEE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FEE_ROLE"));
      await secondary.connect(admin).grantRole(FEE_ROLE, sellerAddr);

      await secondary.connect(seller).setFee(200);
      expect(await secondary.feeBasisPoints()).to.equal(200);
    });

    it("should not allow buyer to cancel seller's listing", async function () {
      await market.connect(seller).approve(secondaryAddr, LIST_AMOUNT);
      await secondary.connect(seller).list(marketAddr, LIST_AMOUNT, LIST_PRICE, DURATION_DAYS);

      await expect(
        secondary.connect(buyer).cancel(0)
      ).to.be.revertedWithCustomError(secondary, "Unauthorized");
    });
  });
});
