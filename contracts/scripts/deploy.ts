import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ProjectMarketFactory with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    console.error("Please set USDC_ADDRESS in .env");
    console.log("Sepolia USDC address: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
    process.exitCode = 1;
    return;
  }

  console.log("Using USDC address:", usdcAddress);

  const ProjectMarketFactory = await ethers.getContractFactory("ProjectMarketFactory");
  const factory = await ProjectMarketFactory.deploy(usdcAddress);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("ProjectMarketFactory deployed to:", factoryAddress);
  console.log("Transaction hash:", factory.deploymentTransaction()?.hash);

  console.log("\nDeployment complete!");
  console.log("Factory address:", factoryAddress);
  console.log("USDC token:", usdcAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
