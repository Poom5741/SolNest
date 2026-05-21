# SolNest Research: Stack & Architecture

## RWA DeFi Landscape (2025-2026)

- **Market size**: $18B+ on-chain private credit, $30B+ total tokenized RWAs
- **Notable protocols**: Goldfinch (emerging market credit, dual-pool), Centrifuge (invoice financing, Polkadot), Maple (institutional lending, ERC-4626 vaults)
- **Per-project lending** is a valid pattern — Goldfinch uses similar borrower-pool model
- **Key standard**: ERC-3643 for compliance-embedded security tokens
- **Oracles**: Chainlink DONs dominant ($14T+ cumulative tx value)
- **L2 preference**: Polygon, Arbitrum, or Base for lower gas costs on many small markets

## Smart Contract Architecture

**Pattern**: Each solar project = standalone lending pool contract + factory for deployment

- **Factory contract**: Deploys new ProjectMarket contracts, maintains registry
- **ProjectMarket contract**: Handles deposits, withdrawals, interest accrual, repayment, default
- **Token**: ERC-20 (or ERC-3643) representing LP position in each project
- **Secondary market**: Allow transfer of LP tokens (ERC-20 transferability)
- **Dev tools**: Hardhat (mature) or Foundry (faster, Rust-based)
- **Testing**: Hardhat tests with Solidity coverage

**Project lifecycle on-chain**:
1. `Created` — Project parameters set (target, APY, duration)
2. `Funding` — Investors deposit, target must be met
3. `Active` — Loan disbursed to homeowner, repayments begin
4. `Repaid` — All principal + interest returned
5. `Defaulted` — Missed payments trigger recovery

## React dApp Best Practices (2025)

**Standard stack**: wagmi v2 + viem + TypeScript (replaces ethers.js)

- **wagmi v2**: React hooks library for wallet connection, contract reads/writes, chain switching
- **viem**: Modern TypeScript Ethereum library (~70kB, typed, EIP-1193 compliant)
- **WalletConnect**: Standard protocol for multi-wallet support
- **Simulate-write pattern**: `useSimulateContract` → `useWriteContract` (prevents failed tx)

**Migration path from current codebase**:
- Current: mock data with `useState`, no Web3 lib
- Target: wagmi + viem for real wallet + contract interactions
- Keep existing UI views, replace mock data gradually
- Extract custom hooks for contract interaction

## Recommended Tooling

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Smart Contracts | Solidity + Hardhat | Mature, extensive docs, good for EVM L2 |
| Frontend Web3 | wagmi v2 + viem | Industry standard for React EVM dApps |
| Testing | Hardhat (SC) + Vitest + RTL (frontend) | Vitest already compatible with Vite |
| L2 | Polygon / Arbitrum / Base | Low cost per project market |
| Oracle | Chainlink | Dominant, proven for RWA data |
