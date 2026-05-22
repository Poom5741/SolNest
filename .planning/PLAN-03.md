# PLAN-03: Phase 3 — Real Data Integration

## Goal
Replace mock data with real on-chain data from deployed contracts. Views unchanged — real hooks match mock hook return types.

## Tasks

### Task 1: Commit outstanding Phase 1/2 work
- Stage all uncommitted changes (test files, hooks, view updates, STATE.md, PLAN files, AGENTS.md, TDG.md)
- Atomic commit with message covering all changes

### Task 2: Install Web3 dependencies
- `npm install wagmi viem @tanstack/react-query`
- Verify TypeScript compatibility

### Task 3: Create Web3Provider infrastructure
- `src/services/Web3Provider.tsx` — wagmi config + React context
  - localhost chain (id: 31337)
  - Hardhat account private key for testing
  - Injected connector for MetaMask
  - QueryClientProvider + WagmiProvider
- Wrap App.tsx with Web3Provider

### Task 4: Start Hardhat node + deploy contracts
- Start Hardhat node on port 8545
- Write deploy script for localhost that deploys MockUSDC → Factory
- Capture deployed addresses → `.planning/contract-addresses.md`
- Verify contracts are callable

### Task 5-8: Create 7 real hooks (PARALLEL)

Each hook goes in `src/services/real/` and returns SAME interface as mock counterpart.

**Hooks grouped by delegation:**

| Agent | Hooks | Key Dependencies |
|-------|-------|-----------------|
| Agent A | `useRealWallet` + `useRealProjects` | useAccount, useBalance, useReadContract (factory) |
| Agent B | `useRealLending` + `useRealPortfolio` | useWriteContract, useReadContract (market) |
| Agent C | `useRealHomeowner` + `useRealAdmin` + `useRealSecondaryMarket` | useWriteContract, lifecycle roles, listing logic |

### Task 9: Wire hooks into App.tsx
- Import real hooks, conditionally use mock vs real based on config/env
- Or: use `VITE_USE_REAL` env flag to toggle mock/real
- Ensure all 5 views receive correct props

### Task 10: Verification
- `npm run dev` → all views render with on-chain data
- `npm test` → 126+ tests pass (update mock tests, add real hook tests)
- `tsc --noEmit` → 0 errors
- `npm run build` → succeeds
