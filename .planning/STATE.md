# Project State

## Current Status
- **Phase**: Phase 5 COMPLETE (Secondary Market)
- **Next action**: Phase 6 planning or deployment

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

## Phase 4 Summary (Complete)

| Requirement | Status | Evidence |
|---|---|---|
| CLO-02 (Workers API) | ✅ | Hono Worker at `src/worker/index.ts` — metadata, risk, telemetry, file upload endpoints |
| CLO-03 (D1 database) | ✅ | Schema + db helpers in `src/worker/schema.sql` + `db.ts`. Tables: project_metadata, risk_assessments, energy_telemetry |
| CLO-04 (R2 storage) | ✅ | Upload/download/delete handlers in `src/worker/r2.ts`. Endpoint: POST /api/upload, GET /api/files/* |
| RSK-01 (risk metrics) | ✅ | RiskBadge component with score breakdown. API endpoint: GET /api/projects/:id/risk |
| RSK-02 (disclosure) | ✅ | RiskBadge shows per-project risk level (Low/Moderate/High) with score |

### Infrastructure
- **Wrangler v4.93.1** — configured with D1 + R2 bindings in `wrangler.toml`
- **Hono** lightweight Worker framework installed
- **Worker tsconfig** separate from root (uses `@cloudflare/workers-types`)
- **Frontend API client** in `src/services/api.ts` with typed endpoints
- `VITE_API_URL` env var to configure API base URL

### Blocked (requires Cloudflare API token)
- CLO-01: Pages deploy (`npx wrangler pages deploy dist/`)
- Creating D1 database (`npx wrangler d1 create solnest-db`)
- Creating R2 bucket (`npx wrangler r2 bucket create solnest-uploads`)

### Verification
- **126 tests** (16 files), 0 failures
- **tsc --noEmit**: 0 errors
- **Build**: succeeds (654KB JS)
- **All phases 1-4 complete**

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

## Phase 5 Summary (Complete)

| Requirement | Status | Evidence |
|---|---|---|
| SEC-01 (List LP tokens) | ✅ | SecondaryMarket.sol list() + useRealSecondaryMarket createListing + UI create form with durationDays |
| SEC-02 (Buy LP tokens) | ✅ | SecondaryMarket.sol buy() + useRealSecondaryMarket buyListing + UI buy button with USDC approval |
| SEC-03 (Order book) | ✅ | On-chain listings mapping + useReadContracts iteration + SecondaryMarketView sorted grid with status badges |

### Smart Contract
- **SecondaryMarket.sol**: Escrow P2P market with list/buy/cancel, AccessControl, ReentrancyGuard, SafeERC20
- **Fee model**: feeBasisPoints (250 = 2.5%), collected from buyer, seller receives full price
- **Expiration**: durationDays-based, client-side filtering for expired status
- **Custom errors**: ListingNotActive, ListingExpired, SelfPurchase, ZeroAmount, ZeroPrice, ZeroDuration, etc.
- **ABI**: `src/abis/SecondaryMarket.abi.json`

### Frontend Hook
- **useRealSecondaryMarket**: Full wagmi integration — useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt
- **Pre-approval flow**: needsApproval (LP tokens), needsUsdcApproval (USDC) with approveLpTokens/approveUsdc helpers
- **Error mapping**: Solidity revert reasons → user-friendly messages
- **Return shape matches mock**: data, myListings, isLoading, error, mutate, buyListing, createListing, cancelListing, refresh, needsApproval, needsUsdcApproval, approveLpTokens, approveUsdc

### UI Evolution
- SecondaryMarketView evolved in-place (D-13)
- Loading skeleton, expired badges, cancel button with confirmation dialog
- Duration input (1-30 days), approve buttons, fee display
- Presentational component pattern maintained (D-14)

### Types & Data
- SecondaryListing extended with expirationDate, status, fee, listingId, durationDays, tokenContract (D-15)
- Mock data updated with new fields
- EN + TH translations for all new strings

### Verification
- **163 tests** (17+ files), 0 failures
- **tsc --noEmit**: 0 errors
- **Build**: succeeds (680KB JS)
- **No as any / @ts-ignore / @ts-expect-error** in new code
- **All 16 design decisions** (D-01 through D-16) confirmed

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
| Hono for Workers API | Locked |
| D1 for off-chain metadata | Locked |
| R2 for document/image storage | Locked |
| VITE_USE_REAL env toggle | Locked |

## Open Questions
- Which L2 to deploy on?
- Token standard (ERC-20 vs ERC-3643)?
- Deploy to Sepolia testnet? (script ready, needs env vars)
- Deploy Workers API + D1 + R2 to production? (needs Cloudflare API token)
- Cloudflare Pages deploy for stakeholder preview? (CLO-01, blocked on API token)

---
*Last updated: 2026-05-22 after Phase 4 completion*
