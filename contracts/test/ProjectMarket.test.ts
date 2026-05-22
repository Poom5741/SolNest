import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ProjectMarket", function () {
  let usdc: Contract;
  let market: Contract;
  let admin: Signer;
  let investor: Signer;
  let investor2: Signer;
  let homeowner: Signer;
  let stranger: Signer;
  let adminAddr: string;
  let investorAddr: string;
  let investor2Addr: string;
  let homeownerAddr: string;
  let strangerAddr: string;

  const TARGET_AMOUNT = ethers.parseUnits("50000", 6);
  const HALF_TARGET = ethers.parseUnits("25000", 6);
  const APY = 1200;
  const DURATION = 365 * 24 * 60 * 60;
  const RISK_SCORE = 5;
  const METADATA_URI = "ipfs://test-uri";
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 6);
  const ZERO = ethers.parseUnits("0", 6);

  beforeEach(async function () {
    [admin, investor, investor2, homeowner, stranger] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    investorAddr = await investor.getAddress();
    investor2Addr = await investor2.getAddress();
    homeownerAddr = await homeowner.getAddress();
    strangerAddr = await stranger.getAddress();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
    market = await ProjectMarket.deploy(
      ethers.ZeroAddress,
      adminAddr,
      await usdc.getAddress(),
      homeownerAddr,
      TARGET_AMOUNT,
      APY,
      DURATION,
      RISK_SCORE,
      "SolNest LP Test",
      "snLP-T",
      METADATA_URI
    );
    await market.waitForDeployment();

    await usdc.connect(admin).mint(investorAddr, TARGET_AMOUNT * 2n);
    await usdc.connect(admin).mint(investor2Addr, TARGET_AMOUNT * 2n);
    await usdc.connect(admin).mint(homeownerAddr, TARGET_AMOUNT * 2n);

    await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT * 2n);
    await usdc.connect(investor2).approve(await market.getAddress(), TARGET_AMOUNT * 2n);
    await usdc.connect(homeowner).approve(await market.getAddress(), TARGET_AMOUNT * 2n);
  });

  describe("Initial State", function () {
    it("should be in Created status", async function () {
      expect(await market.status()).to.equal(0);
    });

    it("should have correct project info", async function () {
      const info = await market.getProjectInfo();
      expect(info.targetAmount).to.equal(TARGET_AMOUNT);
      expect(info.totalFunded).to.equal(0);
      expect(info.totalRepaid).to.equal(0);
      expect(info.apy).to.equal(APY);
      expect(info.duration).to.equal(DURATION);
      expect(info.riskScore).to.equal(RISK_SCORE);
      expect(info.homeowner).to.equal(homeownerAddr);
      expect(info.metadataURI).to.equal(METADATA_URI);
    });

    it("should have correct LP token details", async function () {
      expect(await market.name()).to.equal("SolNest LP Test");
      expect(await market.symbol()).to.equal("snLP-T");
      expect(await market.totalSupply()).to.equal(0);
    });

    it("should have admin as DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await market.hasRole(DEFAULT_ADMIN_ROLE, adminAddr)).to.be.true;
    });

    it("should have admin as LIFECYCLE_ROLE", async function () {
      const LIFECYCLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LIFECYCLE_ROLE"));
      expect(await market.hasRole(LIFECYCLE_ROLE, adminAddr)).to.be.true;
    });
  });

  describe("Lifecycle Transitions", function () {
    it("should transition from Created to Funding", async function () {
      await market.connect(admin).startFunding();
      expect(await market.status()).to.equal(1);
    });

    it("should revert startFunding from non-admin", async function () {
      await expect(
        market.connect(stranger).startFunding()
      ).to.be.reverted;
    });

    it("should revert startFunding if not in Created", async function () {
      await market.connect(admin).startFunding();
      await expect(market.connect(admin).startFunding()).to.be.revertedWithCustomError(
        market,
        "InvalidStatus"
      );
    });

    it("should transition from Funding to Active", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      expect(await market.status()).to.equal(2);
    });

    it("should revert activate if target not met", async function () {
      await market.connect(admin).startFunding();
      await expect(market.connect(admin).activate()).to.be.revertedWithCustomError(
        market,
        "TargetNotMet"
      );
    });

    it("should transition from Active to Repaid", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(homeowner).repay(TARGET_AMOUNT);
      await market.connect(admin).finalizeProject();
      expect(await market.status()).to.equal(3);
    });

    it("should revert finalizeProject if not fully repaid", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await expect(market.connect(admin).finalizeProject()).to.be.revertedWithCustomError(
        market,
        "TargetNotMet"
      );
    });

    it("should transition from Active to Defaulted", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(admin).markDefaulted();
      expect(await market.status()).to.equal(4);
    });
  });

  describe("Deposit Flow", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
    });

    it("should accept deposits and mint LP tokens", async function () {
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);

      const info = await market.getProjectInfo();
      expect(info.totalFunded).to.equal(DEPOSIT_AMOUNT);

      const investorInfo = await market.getInvestorInfo(investorAddr);
      expect(investorInfo.deposited).to.equal(DEPOSIT_AMOUNT);

      expect(await market.balanceOf(investorAddr)).to.equal(DEPOSIT_AMOUNT);
      expect(await market.totalSupply()).to.equal(DEPOSIT_AMOUNT);
    });

    it("should emit Deposited event", async function () {
      await expect(market.connect(investor).deposit(DEPOSIT_AMOUNT))
        .to.emit(market, "Deposited")
        .withArgs(investorAddr, DEPOSIT_AMOUNT);
    });

    it("should track multiple investors", async function () {
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);
      await market.connect(investor2).deposit(DEPOSIT_AMOUNT);

      expect(await market.totalSupply()).to.equal(DEPOSIT_AMOUNT * 2n);

      const info = await market.getProjectInfo();
      expect(info.totalFunded).to.equal(DEPOSIT_AMOUNT * 2n);
    });

    it("should revert deposit in Created state", async function () {
      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const freshMarket = await ProjectMarket.deploy(
        ethers.ZeroAddress,
        adminAddr,
        await usdc.getAddress(),
        homeownerAddr,
        TARGET_AMOUNT,
        APY,
        DURATION,
        RISK_SCORE,
        "Test",
        "TST",
        ""
      );
      await freshMarket.waitForDeployment();

      await usdc.connect(investor).approve(await freshMarket.getAddress(), DEPOSIT_AMOUNT);
      await expect(
        freshMarket.connect(investor).deposit(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(freshMarket, "InvalidStatus");
    });

    it("should revert deposit exceeding target", async function () {
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await expect(
        market.connect(investor2).deposit(1)
      ).to.be.revertedWith("Exceeds target");
    });

    it("should revert with zero amount", async function () {
      await expect(
        market.connect(investor).deposit(0)
      ).to.be.revertedWithCustomError(market, "ZeroAmount");
    });

    it("should transfer USDC to the contract", async function () {
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);
      expect(await usdc.balanceOf(await market.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Withdraw Flow", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);
    });

    it("should allow full withdrawal", async function () {
      const investorUsdcBefore = await usdc.balanceOf(investorAddr);

      await market.connect(investor).withdraw(DEPOSIT_AMOUNT);

      expect(await market.balanceOf(investorAddr)).to.equal(0);
      expect(await market.totalSupply()).to.equal(0);

      const info = await market.getProjectInfo();
      expect(info.totalFunded).to.equal(0);

      const investorUsdcAfter = await usdc.balanceOf(investorAddr);
      expect(investorUsdcAfter).to.equal(investorUsdcBefore + DEPOSIT_AMOUNT);
    });

    it("should emit Withdrawn event", async function () {
      await expect(market.connect(investor).withdraw(DEPOSIT_AMOUNT))
        .to.emit(market, "Withdrawn")
        .withArgs(investorAddr, DEPOSIT_AMOUNT);
    });

    it("should revert withdrawal after Funding ends", async function () {
      await market.connect(investor).withdraw(DEPOSIT_AMOUNT);
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await expect(
        market.connect(investor).withdraw(1)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert withdrawal exceeding balance", async function () {
      await expect(
        market.connect(investor).withdraw(DEPOSIT_AMOUNT + 1n)
      ).to.be.revertedWithCustomError(market, "InsufficientBalance");
    });

    it("should revert withdrawal with zero amount", async function () {
      await expect(
        market.connect(investor).withdraw(0)
      ).to.be.revertedWithCustomError(market, "ZeroAmount");
    });

    it("should allow partial withdrawal", async function () {
      const halfAmount = DEPOSIT_AMOUNT / 2n;
      await market.connect(investor).withdraw(halfAmount);

      expect(await market.balanceOf(investorAddr)).to.equal(halfAmount);
      expect(await market.totalSupply()).to.equal(halfAmount);
    });
  });

  describe("Repay Flow", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
    });

    it("should accept repayment from homeowner", async function () {
      await market.connect(homeowner).repay(DEPOSIT_AMOUNT);

      const info = await market.getProjectInfo();
      expect(info.totalRepaid).to.equal(DEPOSIT_AMOUNT);
    });

    it("should emit Repaid event", async function () {
      await expect(market.connect(homeowner).repay(DEPOSIT_AMOUNT))
        .to.emit(market, "Repaid")
        .withArgs(homeownerAddr, DEPOSIT_AMOUNT);
    });

    it("should revert repay in non-Active state", async function () {
      await market.connect(admin).markDefaulted();
      await expect(
        market.connect(homeowner).repay(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert repay with zero amount", async function () {
      await expect(
        market.connect(homeowner).repay(0)
      ).to.be.revertedWithCustomError(market, "ZeroAmount");
    });

    it("should accept full repayment to reach repaid status", async function () {
      await market.connect(homeowner).repay(TARGET_AMOUNT);
      expect(await market.status()).to.equal(2);
    });
  });

  describe("Claim Flow - Repaid", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(homeowner).repay(TARGET_AMOUNT);
      await market.connect(admin).finalizeProject();
    });

    it("should revert claimRewards in non-terminal state", async function () {
      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const m = await ProjectMarket.deploy(
        ethers.ZeroAddress, adminAddr, await usdc.getAddress(), homeownerAddr,
        TARGET_AMOUNT, APY, DURATION, RISK_SCORE, "ClaimRevert", "CRV", ""
      );
      await m.waitForDeployment();
      await usdc.connect(admin).mint(investorAddr, TARGET_AMOUNT);
      await usdc.connect(investor).approve(await m.getAddress(), TARGET_AMOUNT);
      await m.connect(admin).startFunding();
      await m.connect(investor).deposit(TARGET_AMOUNT);
      await m.connect(admin).activate();

      await expect(
        m.connect(investor).claimRewards()
      ).to.be.revertedWithCustomError(m, "InvalidStatus");
    });

    it("should allow investor to claim after repaid", async function () {
      const investorUsdcBefore = await usdc.balanceOf(investorAddr);

      await market.connect(investor).claimRewards();

      const investorUsdcAfter = await usdc.balanceOf(investorAddr);
      expect(investorUsdcAfter).to.be.gt(investorUsdcBefore);

      expect(await market.balanceOf(investorAddr)).to.equal(0);
    });

    it("should emit Claimed event", async function () {
      await expect(market.connect(investor).claimRewards())
        .to.emit(market, "Claimed")
        .withArgs(investorAddr, TARGET_AMOUNT, 0);
    });

    it("should revert double claim with nothing new", async function () {
      await market.connect(investor).claimRewards();
      await expect(market.connect(investor).claimRewards()).to.be.revertedWith(
        "Nothing to claim"
      );
    });

    it("should track cumulative claimed amount after claim", async function () {
      await market.connect(investor).claimRewards();

      const info = await market.getInvestorInfo(investorAddr);
      expect(info.claimed).to.equal(TARGET_AMOUNT);
      expect(info.claimed).to.be.gt(0);
    });
  });

  describe("Claim Flow - Defaulted", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      const partialRepay = DEPOSIT_AMOUNT;
      await market.connect(homeowner).repay(partialRepay);
      await market.connect(admin).markDefaulted();
    });

    it("should allow investor to claim partial funds after default", async function () {
      const investorUsdcBefore = await usdc.balanceOf(investorAddr);

      await market.connect(investor).claimRewards();

      const investorUsdcAfter = await usdc.balanceOf(investorAddr);
      expect(investorUsdcAfter).to.be.gt(investorUsdcBefore);
      expect(investorUsdcAfter - investorUsdcBefore).to.equal(DEPOSIT_AMOUNT);

      expect(await market.balanceOf(investorAddr)).to.equal(0);
    });

    it("should claim proportional share with multiple investors", async function () {
      const shareTarget = DEPOSIT_AMOUNT * 2n;
      await usdc.connect(admin).mint(investorAddr, shareTarget);
      await usdc.connect(admin).mint(investor2Addr, shareTarget);

      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const anotherMarket = await ProjectMarket.deploy(
        ethers.ZeroAddress,
        adminAddr,
        await usdc.getAddress(),
        homeownerAddr,
        shareTarget,
        APY,
        DURATION,
        RISK_SCORE,
        "SolNest LP Multi",
        "snLP-M",
        ""
      );
      await anotherMarket.waitForDeployment();

      await usdc.connect(investor).approve(await anotherMarket.getAddress(), shareTarget);
      await usdc.connect(investor2).approve(await anotherMarket.getAddress(), shareTarget);

      await usdc.connect(homeowner).approve(await anotherMarket.getAddress(), shareTarget);

      await anotherMarket.connect(admin).startFunding();
      await anotherMarket.connect(investor).deposit(DEPOSIT_AMOUNT);
      await anotherMarket.connect(investor2).deposit(DEPOSIT_AMOUNT);
      await anotherMarket.connect(admin).activate();

      await anotherMarket.connect(homeowner).repay(DEPOSIT_AMOUNT);
      await anotherMarket.connect(admin).markDefaulted();

      const investorBalBefore = await usdc.balanceOf(investorAddr);
      const investor2BalBefore = await usdc.balanceOf(investor2Addr);

      await anotherMarket.connect(investor).claimRewards();
      await anotherMarket.connect(investor2).claimRewards();

      const investorBalAfter = await usdc.balanceOf(investorAddr);
      const investor2BalAfter = await usdc.balanceOf(investor2Addr);

      const investorClaim = investorBalAfter - investorBalBefore;
      const investor2Claim = investor2BalAfter - investor2BalBefore;

      expect(investorClaim).to.equal(DEPOSIT_AMOUNT / 2n);
      expect(investor2Claim).to.equal(DEPOSIT_AMOUNT / 2n);
    });
  });

  describe("Rounding Precision", function () {
    it("should truncate fractional shares (floor division)", async function () {
      const precisionTarget = ethers.parseUnits("3000", 6);
      const precisionRepay = ethers.parseUnits("1000", 6);
      const perInvestor = ethers.parseUnits("1000", 6);

      const [_, __, ___, ____, _____, stranger2] = await ethers.getSigners();
      const s2 = stranger2;
      const s2Addr = await s2.getAddress();

      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const m = await ProjectMarket.deploy(
        ethers.ZeroAddress, adminAddr, await usdc.getAddress(), homeownerAddr,
        precisionTarget, APY, DURATION, RISK_SCORE, "Prec", "PRC", ""
      );
      await m.waitForDeployment();

      for (const signer of [investor, investor2, s2]) {
        await usdc.connect(admin).mint(signer, precisionTarget);
        await usdc.connect(signer).approve(await m.getAddress(), perInvestor);
      }
      await usdc.connect(homeowner).approve(await m.getAddress(), precisionRepay);

      await m.connect(admin).startFunding();
      await m.connect(investor).deposit(perInvestor);
      await m.connect(investor2).deposit(perInvestor);
      await m.connect(s2).deposit(perInvestor);
      await m.connect(admin).activate();

      await m.connect(homeowner).repay(precisionRepay);
      await m.connect(admin).markDefaulted();

      let totalClaimed = 0n;
      for (const signer of [investor, investor2, s2]) {
        const before = await usdc.balanceOf(await signer.getAddress());
        await m.connect(signer).claimRewards();
        const after_ = await usdc.balanceOf(await signer.getAddress());
        const claimed = after_ - before;
        expect(claimed).to.equal(333333333n);
        totalClaimed += claimed;
      }

      expect(totalClaimed).to.equal(999999999n);
    });

    it("should handle tiny deposit in large target pool", async function () {
      const tinyDeposit = ethers.parseUnits("1", 6);
      const hugeRepaid = ethers.parseUnits("1000", 6);

      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const m = await ProjectMarket.deploy(
        ethers.ZeroAddress, adminAddr, await usdc.getAddress(), homeownerAddr,
        TARGET_AMOUNT, APY, DURATION, RISK_SCORE, "Tiny", "TINY", ""
      );
      await m.waitForDeployment();

      await usdc.connect(admin).mint(investorAddr, TARGET_AMOUNT);
      await usdc.connect(admin).mint(investor2Addr, TARGET_AMOUNT);
      await usdc.connect(investor).approve(await m.getAddress(), TARGET_AMOUNT);
      await usdc.connect(investor2).approve(await m.getAddress(), TARGET_AMOUNT);
      await usdc.connect(homeowner).approve(await m.getAddress(), TARGET_AMOUNT);

      await m.connect(admin).startFunding();
      await m.connect(investor).deposit(tinyDeposit);
      await m.connect(investor2).deposit(TARGET_AMOUNT - tinyDeposit);
      await m.connect(admin).activate();

      await m.connect(homeowner).repay(hugeRepaid);
      await m.connect(admin).markDefaulted();

      const usdcBefore = await usdc.balanceOf(investorAddr);
      await m.connect(investor).claimRewards();
      const usdcAfter = await usdc.balanceOf(investorAddr);
      const claimed = usdcAfter - usdcBefore;

      const expected = (tinyDeposit * hugeRepaid) / TARGET_AMOUNT;
      expect(claimed).to.equal(expected);
    });
  });

  describe("Multi-Investor Proportional Claims", function () {
    it("should handle 3 investors with different deposit sizes", async function () {
      const [_, __, ___, ____, _____, stranger2] = await ethers.getSigners();
      const stranger2Addr = await stranger2.getAddress();

      const amounts = [
        ethers.parseUnits("10000", 6),
        ethers.parseUnits("25000", 6),
        ethers.parseUnits("15000", 6),
      ];
      const repayAmount = ethers.parseUnits("40000", 6);

      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const m = await ProjectMarket.deploy(
        ethers.ZeroAddress, adminAddr, await usdc.getAddress(), homeownerAddr,
        TARGET_AMOUNT, APY, DURATION, RISK_SCORE, "Multi3", "MUL3", ""
      );
      await m.waitForDeployment();

      for (const signer of [investor, investor2, stranger2]) {
        await usdc.connect(admin).mint(signer, TARGET_AMOUNT);
        await usdc.connect(signer).approve(await m.getAddress(), TARGET_AMOUNT);
      }
      await usdc.connect(homeowner).approve(await m.getAddress(), TARGET_AMOUNT);

      await m.connect(admin).startFunding();
      await m.connect(investor).deposit(amounts[0]);
      await m.connect(investor2).deposit(amounts[1]);
      await m.connect(stranger2).deposit(amounts[2]);
      await m.connect(admin).activate();

      await m.connect(homeowner).repay(repayAmount);
      await m.connect(admin).markDefaulted();

      const claimers = [
        { signer: investor, deposited: amounts[0], addr: investorAddr },
        { signer: investor2, deposited: amounts[1], addr: investor2Addr },
        { signer: stranger2, deposited: amounts[2], addr: stranger2Addr },
      ];

      let totalClaimed = 0n;
      for (const c of claimers) {
        const before = await usdc.balanceOf(c.addr);
        await m.connect(c.signer).claimRewards();
        const after_ = await usdc.balanceOf(c.addr);
        const claimed = after_ - before;
        const expected = (c.deposited * repayAmount) / TARGET_AMOUNT;
        expect(claimed).to.equal(expected);
        totalClaimed += claimed;
      }

      expect(totalClaimed).to.be.lte(repayAmount);
    });

    it("should give nothing to non-depositor claiming", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(homeowner).repay(TARGET_AMOUNT);
      await market.connect(admin).finalizeProject();

      await expect(
        market.connect(stranger).claimRewards()
      ).to.be.revertedWithCustomError(market, "InsufficientBalance");
    });
  });

  describe("Lifecycle Edge Cases", function () {
    it("should set activatedAt when project enters Active", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);

      const beforeInfo = await market.getProjectInfo();
      expect(beforeInfo.activatedAt).to.equal(0);

      const tx = await market.connect(admin).activate();
      const receipt = await tx.wait();
      const afterInfo = await market.getProjectInfo();

      expect(afterInfo.activatedAt).to.be.gt(0);
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      expect(afterInfo.activatedAt).to.equal(block!.timestamp);
    });

    it("should revert deposit in Active state", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();

      await expect(
        market.connect(investor2).deposit(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert deposit in Repaid state", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(homeowner).repay(TARGET_AMOUNT);
      await market.connect(admin).finalizeProject();

      await expect(
        market.connect(investor2).deposit(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert withdraw in Active state", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();

      await expect(
        market.connect(investor).withdraw(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert repay in Funding state", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);

      await usdc.connect(homeowner).approve(await market.getAddress(), DEPOSIT_AMOUNT);
      await expect(
        market.connect(homeowner).repay(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert repay in Defaulted state", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await market.connect(admin).markDefaulted();

      await usdc.connect(homeowner).approve(await market.getAddress(), DEPOSIT_AMOUNT);
      await expect(
        market.connect(homeowner).repay(DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should revert finalizeProject in non-Active state", async function () {
      await expect(
        market.connect(admin).finalizeProject()
      ).to.be.revertedWithCustomError(market, "InvalidStatus");
    });

    it("should emit StatusChanged events for all transitions", async function () {
      await expect(market.connect(admin).startFunding())
        .to.emit(market, "StatusChanged")
        .withArgs(1);

      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await expect(market.connect(admin).activate())
        .to.emit(market, "StatusChanged")
        .withArgs(2);
    });
  });

  describe("Repay Installments", function () {
    beforeEach(async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await usdc.connect(homeowner).approve(await market.getAddress(), TARGET_AMOUNT);
    });

    it("should allow multiple repay installments", async function () {
      const install1 = ethers.parseUnits("15000", 6);
      const install2 = ethers.parseUnits("20000", 6);
      const install3 = ethers.parseUnits("15000", 6);

      await market.connect(homeowner).repay(install1);
      let info = await market.getProjectInfo();
      expect(info.totalRepaid).to.equal(install1);

      await market.connect(homeowner).repay(install2);
      info = await market.getProjectInfo();
      expect(info.totalRepaid).to.equal(install1 + install2);

      await market.connect(homeowner).repay(install3);
      info = await market.getProjectInfo();
      expect(info.totalRepaid).to.equal(install1 + install2 + install3);
    });
  });

  describe("GetInvestorInfo Edge Cases", function () {
    it("should return zeros for non-investor", async function () {
      const info = await market.getInvestorInfo(strangerAddr);
      expect(info.deposited).to.equal(0);
      expect(info.claimed).to.equal(0);
    });

    it("should update investor info after deposit", async function () {
      await market.connect(admin).startFunding();
      await market.connect(investor).deposit(DEPOSIT_AMOUNT);

      const info = await market.getInvestorInfo(investorAddr);
      expect(info.deposited).to.equal(DEPOSIT_AMOUNT);
      expect(info.claimed).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("should revert lifecycle functions for non-admin", async function () {
      const LIFECYCLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LIFECYCLE_ROLE"));

      await expect(
        market.connect(stranger).startFunding()
      ).to.be.reverted;

      await expect(
        market.connect(stranger).activate()
      ).to.be.reverted;

      await expect(
        market.connect(stranger).finalizeProject()
      ).to.be.reverted;

      await expect(
        market.connect(stranger).markDefaulted()
      ).to.be.reverted;
    });

    it("should revert when non-homeowner attempts to repay", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await usdc.connect(admin).mint(strangerAddr, DEPOSIT_AMOUNT);
      await usdc.connect(stranger).approve(await market.getAddress(), DEPOSIT_AMOUNT);
      await expect(market.connect(stranger).repay(DEPOSIT_AMOUNT)).to.be.revertedWithCustomError(
        market,
        "NotHomeowner"
      );
    });

    it("should allow homeowner to repay", async function () {
      await market.connect(admin).startFunding();
      await usdc.connect(investor).approve(await market.getAddress(), TARGET_AMOUNT);
      await market.connect(investor).deposit(TARGET_AMOUNT);
      await market.connect(admin).activate();
      await usdc.connect(homeowner).approve(await market.getAddress(), DEPOSIT_AMOUNT);
      await expect(market.connect(homeowner).repay(DEPOSIT_AMOUNT)).to.not.be.reverted;
    });
  });
});
