/// Contract addresses deployed to local Hardhat node
/// Update after running deploy-localhost.ts

export const CONTRACTS = {
  mockUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  factory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
} as const;

export const HARDHAT_CHAIN_ID = 31337;

/// Helper to check if addresses are populated
export function areContractsDeployed(): boolean {
  return CONTRACTS.mockUSDC.length > 0 && CONTRACTS.factory.length > 0;
}
