import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SecondaryMarket with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    console.error("Please set USDC_ADDRESS in .env");
    process.exitCode = 1;
    return;
  }

  const adminAddress = deployer.address;
  const feeCollectorAddress = deployer.address;
  const initialFeeBps = 150; // 1.5%

  console.log("Using USDC address:", usdcAddress);
  console.log("Admin:", adminAddress);
  console.log("Fee collector:", feeCollectorAddress);
  console.log("Initial fee:", initialFeeBps, "bps (1.5%)");

  const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
  const market = await SecondaryMarket.deploy(
    usdcAddress,
    adminAddress,
    feeCollectorAddress,
    initialFeeBps
  );

  await market.waitForDeployment();

  const marketAddress = await market.getAddress();
  console.log("\nSecondaryMarket deployed to:", marketAddress);
  console.log("Transaction hash:", market.deploymentTransaction()?.hash);

  console.log("\nDeployment complete!");
  console.log("SecondaryMarket address:", marketAddress);
  console.log("USDC token:", usdcAddress);
  console.log("\nSet VITE_SECONDARY_MARKET_ADDRESS=" + marketAddress + " in your .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
