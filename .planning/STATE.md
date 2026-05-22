# Project State

## Current Status
- **Phase**: Phase 2 COMPLETE (Smart Contracts)
- **Next action**: Phase 3 — Real Data Integration (`/gsd-plan-phase 3`)

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

## Key Decisions

| Decision | Status |
|----------|--------|
| Per-project lending (no pools) | Locked |
| Full-service project sourcing | Locked |
| No insurance — transparent risk | Locked |
| wagmi v2 + viem for Web3 | Planned (Phase 3) |
| Solidity + Hardhat for SC | Locked |
| EVM L2 (Polygon/Arbitrum/Base) | TBD |
| ERC20 LP token per project | Locked |
| AccessControl (OZ) + ReentrancyGuard | Locked |

## Open Questions
- Which L2 to deploy on?
- Token standard (ERC-20 vs ERC-3643)?
- Deploy to Sepolia testnet? (script ready, needs env vars)

---
*Last updated: 2026-05-22 after Phase 2 completion*
