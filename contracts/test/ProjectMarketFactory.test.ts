import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

describe("ProjectMarketFactory", function () {
  let factory: Contract;
  let usdc: Contract;
  let admin: Signer;
  let nonAdmin: Signer;
  let homeowner: Signer;
  let adminAddr: string;
  let nonAdminAddr: string;
  let homeownerAddr: string;

  const TARGET_AMOUNT = ethers.parseUnits("50000", 6);
  const APY = 1200;
  const DURATION = 365 * 24 * 60 * 60;
  const RISK_SCORE = 5;
  const METADATA_URI = "ipfs://test-uri";

  beforeEach(async function () {
    [admin, nonAdmin, homeowner] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    nonAdminAddr = await nonAdmin.getAddress();
    homeownerAddr = await homeowner.getAddress();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const ProjectMarketFactory = await ethers.getContractFactory("ProjectMarketFactory");
    factory = await ProjectMarketFactory.deploy(await usdc.getAddress());
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the USDC token address", async function () {
      expect(await factory.usdcToken()).to.equal(await usdc.getAddress());
    });

    it("should set deployer as DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, adminAddr)).to.be.true;
    });

    it("should start with zero projects", async function () {
      expect(await factory.getProjectCount()).to.equal(0);
    });
  });

  describe("Project Creation", function () {
    it("should create a project and emit event", async function () {
      const tx = await factory.connect(admin).createProject(
        homeownerAddr,
        TARGET_AMOUNT,
        APY,
        DURATION,
        RISK_SCORE,
        METADATA_URI
      );
      const receipt = await tx.wait();

      expect(await factory.getProjectCount()).to.equal(1);

      const projectAddr = await factory.getProject(0);
      expect(projectAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("should increment project count for multiple projects", async function () {
      await factory.connect(admin).createProject(
        homeownerAddr,
        TARGET_AMOUNT,
        APY,
        DURATION,
        RISK_SCORE,
        METADATA_URI
      );
      await factory.connect(admin).createProject(
        homeownerAddr,
        TARGET_AMOUNT,
        APY,
        DURATION,
        RISK_SCORE,
        METADATA_URI
      );

      expect(await factory.getProjectCount()).to.equal(2);
    });

    it("should revert when non-admin tries to create", async function () {
      await expect(
        factory.connect(nonAdmin).createProject(
          homeownerAddr,
          TARGET_AMOUNT,
          APY,
          DURATION,
          RISK_SCORE,
          METADATA_URI
        )
      ).to.be.revertedWithCustomError(factory, "NotAdmin");
    });

    it("should revert with zero homeowner address", async function () {
      await expect(
        factory.connect(admin).createProject(
          ethers.ZeroAddress,
          TARGET_AMOUNT,
          APY,
          DURATION,
          RISK_SCORE,
          METADATA_URI
        )
      ).to.be.revertedWithCustomError(factory, "ZeroAddress");
    });

    it("should revert with zero target amount", async function () {
      await expect(
        factory.connect(admin).createProject(
          homeownerAddr,
          0,
          APY,
          DURATION,
          RISK_SCORE,
          METADATA_URI
        )
      ).to.be.revertedWithCustomError(factory, "ZeroTarget");
    });

    it("should revert for out-of-bounds project index", async function () {
      await expect(factory.getProject(0)).to.be.revertedWith("Index out of bounds");
    });

    it("should create a market that is a valid contract", async function () {
      await factory.connect(admin).createProject(
        homeownerAddr,
        TARGET_AMOUNT,
        APY,
        DURATION,
        RISK_SCORE,
        METADATA_URI
      );

      const projectAddr = await factory.getProject(0);
      const ProjectMarket = await ethers.getContractFactory("ProjectMarket");
      const market = ProjectMarket.attach(projectAddr);

      const projInfo = await market.getProjectInfo();
      expect(projInfo.targetAmount).to.equal(TARGET_AMOUNT);
      expect(projInfo.homeowner).to.equal(homeownerAddr);
    });
  });
});
