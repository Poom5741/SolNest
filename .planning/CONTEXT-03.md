# Phase 3 CONTEXT — Real Data Integration

## Domain: SolNest — Solana/Solar Lending Platform (EVM, not Solana)

> **Correction**: Despite the name "SolNest", the project uses EVM-compatible Solidity contracts. "Sol" refers to solar, not Solana.

## Decisions Locked

| # | Decision | Value |
|---|----------|-------|
| 1 | **Dev environment** | Local Hardhat node at `localhost:8545` |
| 2 | **Web3 library** | wagmi v2 + viem |
| 3 | **Hook replacement** | Replace all 7 mock hooks → real hooks in parallel |
| 4 | **Sepolia deploy** | Attempt if .env vars available; not blocking |
| 5 | **View compatibility** | New hooks must return same interfaces as mocks (views unchanged) |
| 6 | **Provider pattern** | Create `Web3Provider` React context (following Toast context pattern) |

## Architecture

```
App.tsx
├── Web3Provider (wagmi config + providers)
│   ├── WalletProvider (account state)
│   ├── ContractProvider (contract instances)
│   └── Views (unchanged props interface)
│       └── useReal* hooks (wagmi read/write)
├── ToastProvider (existing)
└── ErrorBoundary
```

### Hook Mapping

| Mock Hook | Real Hook | wagmi/viem Primitives |
|---|---|---|
| `useMockWallet` | `useRealWallet` | `useAccount`, `useConnect`, `useDisconnect`, `useBalance` |
| `useMockProjects` | `useRealProjects` | `useReadContract` (factory.getAllProjects, market.getProjectInfo) |
| `useMockLending` | `useRealLending` | `useWriteContract` (deposit, withdraw, claim), `useReadContract` |
| `useMockPortfolio` | `useRealPortfolio` | `useReadContract` (LP token balanceOf, market.getInvestorInfo) |
| `useMockHomeowner` | `useRealHomeowner` | `useReadContract` (market.getProjectInfo, telemetry — still mock) |
| `useMockAdmin` | `useRealAdmin` | `useWriteContract` (factory.createProject, lifecycle) |
| `useMockSecondaryMarket` | `useRealSecondaryMarket` | `useReadContract` / `useWriteContract` (listing logic) |

### Real Hook Shape

Each real hook exports the SAME interface as its mock counterpart:
```ts
interface UseRealXReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;  // refetch
  // ... domain-specific actions (async, useWriteContract internally)
}
```

## Deployed Contract Addresses (Hardhat localhost)

Will be written to `.planning/contract-addresses.md` after deployment.

## Open Questions (deferred)
- **Secondary Market on-chain**: V1.0 smart contracts don't have secondary market logic. For Phase 3, secondary market stays mocked OR is a simple P2P non-contract feature.
- **Energy Telemetry**: Stays mocked (requires IoT off-chain service — Phase 4).

## Phase 3 Requirements Coverage

| Req | Description | Approach |
|-----|-------------|----------|
| WAL-01 | Real wallet connect (MetaMask) | wagmi `useConnect` + `injected` connector |
| WAL-02 | Real balance display | `useBalance` for native token |
| WAL-03 | Disconnect + account switching | `useDisconnect`, `useAccount` watch |
| MKT-01 | Marketplace reads from contract | `useReadContract` on ProjectMarketFactory + ProjectMarket |
| MKT-02 | Real project detail data | Token name, symbol, target, funded, APY from contract |
| MKT-03 | Real funding progress | `fundedAmount / targetAmount` from contract |
| LND-01 | Real deposit (write) | `useWriteContract` → `deposit()` |
| LND-02 | Real withdraw | `useWriteContract` → `withdraw()` |
| LND-03 | Real claim | `useWriteContract` → `claimRewards()` |
| LND-04 | Real transaction feedback | wagmi `useWaitForTransactionReceipt` for toast |
| HOM-01 | Real loan data | Contract state for homeowner |
| HOM-02 | Real repay | `useWriteContract` → `repay()` |
| HOM-03 | Telemetry mocked | Stays mock (needs Phase 4 IoT) |
| HOM-04 | Inverter data mocked | Stays mock (needs Phase 4 IoT) |
| ADM-01 | Real create project | `useWriteContract` → `factory.createProject()` |
| ADM-02 | Real lifecycle | `useWriteContract` → lifecycle functions |
| ADM-03 | Real admin access control | check `DEFAULT_ADMIN_ROLE` |
| ADM-04 | Factory management | read/write through factory |
