import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer, homeowner, user2, user3] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Homeowner:", homeowner.address);
  console.log("User2:", user2.address);
  console.log("User3:", user3.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("\nMockUSDC deployed to:", usdcAddress);

  const mintAmount = ethers.parseUnits("1000000", 6);
  await usdc.mint(deployer.address, mintAmount);
  await usdc.mint(homeowner.address, mintAmount);
  await usdc.mint(user2.address, mintAmount);
  await usdc.mint(user3.address, mintAmount);
  console.log("Minted 1,000,000 USDC to deployer, homeowner, user2, user3");

  const Factory = await ethers.getContractFactory("ProjectMarketFactory");
  const factory = await Factory.deploy(usdcAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("\nProjectMarketFactory deployed to:", factoryAddress);

  const projects = [
    { target: ethers.parseUnits("50000", 6), apy: 1200n, duration: 365n * 24n * 3600n, risk: 5n, uri: "ipfs://bangkok-solar" },
    { target: ethers.parseUnits("75000", 6), apy: 1500n, duration: 365n * 24n * 3600n, risk: 4n, uri: "ipfs://chiangmai-solar" },
    { target: ethers.parseUnits("30000", 6), apy: 1000n, duration: 180n * 24n * 3600n, risk: 3n, uri: "ipfs://phuket-solar" },
  ];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const tx = await factory.connect(deployer).createProject(
      homeowner.address, p.target, p.apy, p.duration, p.risk, p.uri
    );
    const receipt = await tx.wait();
    console.log(`Project ${i + 1} created. TX: ${receipt?.hash}`);
  }

  const projectCount = await factory.getProjectCount();
  console.log("\nTotal projects created:", projectCount.toString());

  const projectAddresses: string[] = [];
  for (let i = 0; i < Number(projectCount); i++) {
    const addr = await factory.getProject(i);
    projectAddresses.push(addr);
    console.log(`  Project ${i}: ${addr}`);
  }

  const output = {
    chainId: 31337,
    mockUSDC: usdcAddress,
    factory: factoryAddress,
    projects: projectAddresses,
    accounts: {
      deployer: deployer.address,
      homeowner: homeowner.address,
      user2: user2.address,
      user3: user3.address,
    },
  };

  const outputPath = path.join(__dirname, "..", "..", ".planning", "contract-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log("\nAddresses written to:", outputPath);

  console.log("\n--- Update src/services/real/contracts.ts with these values ---");
  console.log(`mockUSDC: "${usdcAddress}",`);
  console.log(`factory: "${factoryAddress}",`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
