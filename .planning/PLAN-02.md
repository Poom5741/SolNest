# PLAN-02: Smart Contracts

**Phase**: 2 — Smart Contracts
**Milestone**: v1.0
**Baseline**: Contracts ~70% complete (ProjectMarket.sol, Factory, MockUSDC, 48 tests, Hardhat configured)
**Scope**: Fix 2 security bugs, fill test gaps, deploy Sepolia, generate TypeChain, document limitations

---

## Task 1: Fix Bug 1 — `repay()` Access Control (HIGH)

**Bug**: `repay(uint256 amount)` has no access control — anyone can call it. Only homeowner or SolNest admin should be able to repay.

**Fix**:
- ProjectMarket.sol: Add `onlyRole(HOMEOWNER_ROLE)` modifier to `repay()` (or `hasRole(HOMEOWNER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender)`)
- Add test: non-homeowner cannot call repay (expects revert)
- Add test: homeowner CAN call repay (existing tests verify repay logic)

**Files**: `contracts/ProjectMarket.sol`, `contracts/test/ProjectMarket.test.ts`

---

## Task 2: Fix Bug 2 — `claimRewards` One-Time Lock (HIGH)

**Bug**: `if (investor.claimed > 0) revert AlreadyClaimed()` permanently blocks future claims after first claim. Rewards accrue over time — investors should claim multiple times.

**Fix**:
- Replace `claimed > 0` check with per-claim tracking using `lastClaimedAt` timestamp
- Calculate rewards since `lastClaimedAt` instead of lump sum
- Or: remove the restriction entirely — each claim calculates `investor.amountInvested * rewardsPerToken - rewardsPaid`
- Add test: claim rewards twice without revert
- Add test: second claim only gets incremental rewards (not double)

**Files**: `contracts/ProjectMarket.sol`, `contracts/test/ProjectMarket.test.ts`

---

## Task 3: Fill Test Gaps (HIGH)

### 3a — Rounding Precision Tests
- Deposit odd amounts (non-1:1 USDC:LP ratio due to 6 vs 18 decimals)
- Withdraw partial amounts — verify correct LP token burn
- Claim rewards with fractional rewardsPerToken accumulation

### 3b — Multi-Investor Proportional Claims
- 2 investors deposit different amounts (e.g., 1000 USDC + 500 USDC)
- Verify rewards distribution is proportional to share
- Verify LP token minting proportional to deposit share

### 3c — Invariant / Fuzz Tests
- Invariant: `totalDeposits - totalWithdrawals == contract USDC balance` (minus rewards)
- Invariant: total LP supply matches sum of all LP holder balances
- Fuzz: random deposit/withdraw sequences never break contract state

### 3d — Access Control Edge Cases
- Verify all lifecycle transitions are role-gated
- DEFAULT_ADMIN_ROLE can grant/revoke roles only

**Target**: 65+ total tests after gaps filled

**Files**: `contracts/test/ProjectMarket.test.ts`, `contracts/test/ProjectMarketFactory.test.ts`

---

## Task 4: Run Full Test Suite + Coverage (HIGH)

```bash
cd contracts && npx hardhat test
cd contracts && npx hardhat coverage
```

**Success criteria**: All tests pass, coverage >80% on both contracts.

---

## Task 5: Generate TypeChain Types (MEDIUM)

```bash
cd contracts && npx hardhat typechain
```

Generates `contracts/typechain-types/` from compiled ABIs. Verifies output is non-empty and contains ProjectMarket, ProjectMarketFactory, MockUSDC type bindings.

**Files**: `contracts/typechain-types/` (auto-generated)

---

## Task 6: Deploy to Sepolia + Verify (HIGH)

**Pre-reqs**: `.env` with `SEPOLIA_RPC_URL`, `PRIVATE_KEY` (deployer with Sepolia ETH), `ETHERSCAN_API_KEY`

```bash
cd contracts && npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat verify --network sepolia <factory-address>
```

**Success criteria**: Contracts deployed, verified on Etherscan, addresses documented in STATE.md.

---

## Task 7: Final Verification (LOW)

- `npx hardhat compile` — no errors
- `npx hardhat test` — all 65+ tests pass
- `tsc --noEmit` — clean (contracts/)
- Export ABIs: `node scripts/export-abis.js`
- Update STATE.md: mark SC-01 through SC-07 as complete
- Document known limitations (no upgradeability, gas cost of `new ProjectMarket()`, one-time claim semantics if kept)

---

## Execution Notes

- **Tasks 1+2 can run in parallel** (different code paths in same file, but independent bug fixes)
- **Task 3 depends on Tasks 1+2** (tests must reflect new behavior, especially for repay + claimRewards)
- **Task 4 depends on Task 3** (need updated test suite before coverage)
- **Task 5 is independent** (TypeChain generates from any compiled ABIs, doesn't need bugs fixed)
- **Task 6 is independent** (if we deploy buggy contracts, they can be redeployed. But ideally after Tasks 1-2)
- **Task 7 depends on all prior tasks**
