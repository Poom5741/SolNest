# Project State

## Current Status
- **Phase**: Phase 3 COMPLETE (Real Data Integration)
- **Next action**: Phase 4 — Cloudflare Backend + Production Polish

## Phase 1 Summary (Complete)

| Requirement | Status | Evidence |
|---|---|---|
| TCH-01 (strict mode) | ✅ | `tsc --noEmit` = 0 errors |
| TCH-02 (test infra) | ✅ | 126 tests, 16 files, all passing |
| TCH-03 (logic extract) | ✅ | `useFormatCurrency.ts` + `useProjectFilters.ts` |
| TCH-04 (no alert()) | ✅ | 0 alert() calls |
| TCH-05 (i18n) | ✅ | 131 EN + 131 TH keys, 0 missing |
| DEM-01 (mock services) | ✅ | 7 hooks, 56 tests |
| DEM-02-07 (views) | ✅ | 5 views + 3 shared, 68 tests |
| DEM-08 (live demo) | ✅ | Build succeeds (dist/ ready) |
| CLO-01 (deploy) | ⬜ | Blocked — needs CLOUDFLARE_API_TOKEN |

## Phase 2 Summary (Complete)

| Requirement | Status | Evidence |
|---|---|---|
| SC-01 (ProjectMarket) | ✅ | ERC20 LP per project, AccessControl, ReentrancyGuard |
| SC-02 (deposit/withdraw) | ✅ | 1:1 USDC:LP, Funding-only with target cap |
| SC-03 (repay/claim) | ✅ | Homeowner-only repay, cumulative claimRewards |
| SC-04 (lifecycle) | ✅ | Created→Funding→Active→Repaid/Defaulted |
| SC-05 (access control) | ✅ | LIFECYCLE_ROLE, onlyHomeowner, DEFAULT_ADMIN_ROLE |
| SC-06 (Factory) | ✅ | Admin-gated createProject, LP naming snLP-{N} |
| SC-07 (Sepolia) | ⬜ | Blocked — needs PRIVATE_KEY + SEPOLIA_RPC_URL in .env |

### Bug Fixes Applied
- **repay() access control**: Added `onlyHomeowner` modifier (anyone could repay before)
- **claimRewards one-time lock**: Changed to cumulative tracking (was locked after first claim)

### Test Coverage
- **66 tests**, 0 failures (ProjectMarket: 56, Factory: 10)
- **100% line coverage** on ProjectMarket.sol and ProjectMarketFactory.sol
- **82.56% branch coverage** overall

### Artifacts
- TypeChain types regenerated (68 typings from 20 artifacts)
- ABIs exported to `src/abis/` (5 files)
- Contracts compiled (Solidity 0.8.24, optimizer 200 runs)

## Phase 3 Summary (Complete)

| Requirement | Status | Evidence |
|---|---|---|
| WAL-01 (wagmi/viem) | ✅ | wagmi v2 + viem + @tanstack/react-query installed |
| WAL-02 (wallet hooks) | ✅ | `useRealWallet` — useAccount, useConnect, useDisconnect, USDC balanceOf |
| WAL-03 (connect/disconnect) | ✅ | Injected connector (MetaMask), localhost:8545 |
| MKT-01 (real projects) | ✅ | `useRealProjects` — reads Factory getProjectCount + getProject + Market getProjectInfo |
| MKT-02 (real funding) | ✅ | Factory + Market read contracts mapping to Project[] type |
| MKT-03 (real terms) | ✅ | APY, targetAmount, duration, riskScore from on-chain |
| LND-01 (real deposit) | ✅ | `useRealLending` — approve USDC + deposit via useWriteContract |
| LND-02 (real withdraw) | ✅ | withdraw with useWriteContract |
| LND-03 (real claim) | ✅ | claimRewards with cumulative tracking (matches contract fix) |
| LND-04 (portfolio) | ✅ | `useRealPortfolio` — aggregates from real lending positions |
| HOM-01 (homeowner) | ✅ | `useRealHomeowner` — loan info from on-chain, telemetry mocked |
| ADM-01 (admin create) | ✅ | `useRealAdmin` — createProject + lifecycle via Factory |
| ADM-02 (lifecycle) | ✅ | startFunding, activate, finalizeProject, markDefaulted writes |

### Infrastructure
- **Local Hardhat node** at `http://127.0.0.1:8545`
- Deployed: MockUSDC (`0x5FbD...`), Factory (`0x5FC8...`), 3 sample projects
- 1,000,000 USDC minted to 4 test accounts
- Contract addresses in `.planning/contract-addresses.json`

### Toggle
- Set `VITE_USE_REAL=true` to use on-chain hooks
- Default (no var) uses mock hooks — existing tests unchanged

### Verification
- **126 tests** (16 files), 0 failures
- **tsc --noEmit**: 0 errors
- **Build**: succeeds (651KB JS)

## Key Decisions

| Decision | Status |
|----------|--------|
| Per-project lending (no pools) | Locked |
| Full-service project sourcing | Locked |
| No insurance — transparent risk | Locked |
| wagmi v2 + viem for Web3 | Locked |
| Solidity + Hardhat for SC | Locked |
| EVM L2 (Polygon/Arbitrum/Base) | TBD |
| ERC20 LP token per project | Locked |
| AccessControl (OZ) + ReentrancyGuard | Locked |
| Local Hardhat node for dev | Locked |
| VITE_USE_REAL env toggle | Locked |

## Open Questions
- Which L2 to deploy on?
- Token standard (ERC-20 vs ERC-3643)?
- Deploy to Sepolia testnet? (script ready, needs env vars)

---
*Last updated: 2026-05-22 after Phase 3 completion*
