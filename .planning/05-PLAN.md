# Phase 5: Secondary Market — PLAN

**Phase:** 5
**Milestone:** v1.0 SolNest
**Created:** 2026-05-22
**Status:** Ready for execution
**Goal:** Allow investors to trade LP positions via a P2P on-chain escrow market with USDC pricing.

## Pre-Existing Work

Tasks already completed that Phase 5 builds upon:

| Requirement | Status | Evidence |
|---|---|---|
| Phase 3 (Real Data Integration) | ✅ Complete | 126 tests, 0 failures, BUILD.md success |
| SecondaryMarketView.tsx | ✅ Exists | Full presentational component with listings grid, buy button, create listing modal |
| useRealSecondaryMarket hook | ⚠️ Stub | Wired into App.tsx but uses local mock data |
| useMockSecondaryMarket hook | ✅ Exists | Interface shape reference for real hook parity |
| SecondaryListing type | ✅ Exists | `id, projectId, projectName, amount, price, seller, createdAt` |
| ProjectMarket.sol (ERC20 LP) | ✅ Exists | ERC20 + AccessControl + ReentrancyGuard — compatible via IERC20 |
| MockUSDC.sol | ✅ Exists | Deployed in Phase 2 |
| wagmi v2 + viem | ✅ Installed | useReadContract, useWriteContract, useWaitForTransactionReceipt |
| Hardhat + TypeChain | ✅ Configured | Phase 2 deployment pipeline |
| Vitest + Testing Library | ✅ Configured | 126 existing tests |

## Design Decisions (from CONTEXT-05.md)

| ID | Decision |
|----|----------|
| D-01 | Simple P2P offer system — fixed price, no bid/ask matching |
| D-02 | Partial sales allowed — sell any USDC amount of LP position |
| D-03 | Fixed price, seller sets — no negotiation |
| D-04 | Listings expire after N days — auto-cancel, return tokens |
| D-05 | Escrow — LP tokens transferred to contract when listed |
| D-06 | Buyer receives yield from purchase date |
| D-07 | Sellers can cancel anytime before expiration |
| D-08 | Protocol fee 1-2% on each trade |
| D-09 | USDC only pricing |
| D-10 | Unconstrained pricing — no floor/ceiling |
| D-11 | Total USDC cost per listed amount — one price, one transaction |
| D-12 | Fee added on top to buyer — seller receives full list price |
| D-13 | Evolve SecondaryMarketView.tsx in-place |
| D-14 | Component stays presentational — props-in, events-out |
| D-15 | Extend SecondaryListing type — backward compatible |
| D-16 | Keep existing tests + extend with contract-integration tests |

---

## Tasks

### Task 1: SecondaryMarket.sol — Smart Contract

**Priority:** High | **Dependencies:** None | **Estimate:** 45 min

Create the escrow-based P2P secondary market contract following existing ProjectMarket.sol patterns (ERC20, AccessControl, ReentrancyGuard, SafeERC20).

**Checklist:**

- [ ] Create `contracts/contracts/SecondaryMarket.sol`
- [ ] Define `Listing` struct: `id (uint256)`, `seller (address)`, `tokenContract (address)`, `amount (uint256)`, `price (uint256)`, `expiresAt (uint256)`, `active (bool)`
- [ ] Define roles: `DEFAULT_ADMIN_ROLE`, `FEE_ROLE`
- [ ] Immutable `IERC20 public immutable usdc`
- [ ] Storage: `feeBasisPoints (uint256)`, `nextListingId (uint256)`, `mapping(uint256 => Listing) public listings`
- [ ] Events: `Listed`, `Purchased`, `Cancelled`, `FeeUpdated`
- [ ] `list(address tokenContract, uint256 amount, uint256 price, uint256 durationDays)` — `safeTransferFrom` escrow, store listing, emit Listed
- [ ] `buy(uint256 listingId) nonReentrant` — validate active/not expired/not self, calc fee, transfer USDC to seller+feeCollector, transfer LP to buyer, mark inactive, emit Purchased
- [ ] `cancel(uint256 listingId)` — only seller or admin, return escrowed tokens, emit Cancelled
- [ ] `setFee(uint256 newFeeBps)` — FEE_ROLE only, max 10000
- [ ] Input validation: `require(amount > 0)`, `require(price > 0)`, `require(durationDays > 0)`
- [ ] `require(msg.sender != listing.seller)` on buy (self-purchase prevention)
- [ ] SPDX: MIT, Solidity ^0.8.24
- [ ] Create `contracts/contracts/interfaces/ISecondaryMarket.sol` following IProjectMarket.sol pattern

**Verification:** `npx hardhat compile` — no errors.

---

### Task 2: Smart Contract Tests

**Priority:** High | **Dependencies:** Task 1 | **Estimate:** 45 min

Follow Phase 2 test patterns (66 existing contract tests, 100% line coverage target).

**Checklist:**

- [ ] Create `contracts/test/SecondaryMarket.test.ts`
- [ ] Fixture: deploy MockUSDC + SecondaryMarket(usdc), mint/approve tokens for test accounts
- [ ] Happy path: `list()` creates listing with correct values, emits Listed
- [ ] Happy path: `buy()` transfers USDC to seller, LP to buyer, fee to feeCollector, emits Purchased
- [ ] Happy path: `cancel()` returns LP tokens, emits Cancelled
- [ ] Edge case: cannot buy expired listing
- [ ] Edge case: cannot buy own listing
- [ ] Edge case: cannot cancel listing not owned
- [ ] Edge case: zero amount/price/duration rejected
- [ ] Fee calculation: verify exact fee for 100 bps (1%), 200 bps (2%)
- [ ] `setFee()`: only FEE_ROLE, max 10000 enforced

**Verification:** `npx hardhat test` — all pass, 100% line coverage.

---

### Task 3: Types + Mock Data Update

**Priority:** High | **Dependencies:** Task 1 | **Estimate:** 20 min

Extend `SecondaryListing` interface and update mock/stub data to match new contract reality.

**Checklist:**

- [ ] Extend `SecondaryListing` in `src/types.ts`: add `expirationDate?: string`, `status?: "active" | "expired" | "cancelled" | "sold"`, `fee?: number`, `listingId?: number`
- [ ] Update mock data in `src/services/mock/useMockSecondaryMarket.ts` with new fields
- [ ] Update stub data in `src/services/real/useRealSecondaryMarket.ts` with new fields
- [ ] Update mock tests for new fields
- [ ] Add translations (`en` + `th`): `smExpires`, `smExpired`, `smCancelListing`, `smCancelConfirm`, `smFee`, `smNoMyListings`, `smApproveFirst`
- [ ] Backward compatibility — existing fields unchanged

**Verification:** `tsc --noEmit` clean, existing tests still pass.

---

### Task 4: useRealSecondaryMarket Hook — Contract Integration

**Priority:** High | **Dependencies:** Task 1, Task 3 | **Estimate:** 60 min

Replace the stub with real wagmi read/write contract calls. Match mock hook interface for view compatibility.

**Checklist:**

- [ ] Read contract address from `import.meta.env.VITE_SECONDARY_MARKET_ADDRESS`
- [ ] `useReadContract` — query `nextListingId` then iterate to build `SecondaryListing[]` with all new fields
- [ ] Client-side expired listing filtering: `expiresAt * 1000 < Date.now()` → `status = "expired"`
- [ ] `useAccount` for connected wallet
- [ ] `useWriteContract` for `list(tokenContract, amount, price, durationDays)`
- [ ] Pre-approval check: `needsApproval` boolean for LP token allowance
- [ ] `useWriteContract` for `buy(listingId)`
- [ ] Pre-approval check: `needsApproval` boolean for USDC allowance
- [ ] `useWriteContract` for `cancel(listingId)` — seller's listings only
- [ ] `useWaitForTransactionReceipt` for all writes — `isLoading` during pending
- [ ] `mutate` triggers refetch after write completes
- [ ] Export interface: `{ data, myListings, isLoading, error, mutate, buyListing, createListing: listForSale, cancelListing, needsApproval }`
- [ ] `myListings` = filtered by `seller === walletAddress`
- [ ] Error handling: map Solidity reverts to user-friendly toast messages

**Verification:** `tsc --noEmit` clean, hook exports same shape as mock.

---

### Task 5: SecondaryMarketView UI Evolution

**Priority:** Medium | **Dependencies:** Task 3, Task 4 | **Estimate:** 45 min

Evolve `SecondaryMarketView.tsx` in-place per D-13/D-14 (presentational pattern).

**Checklist:**

- [ ] Add `onCancel: (listingId: string) => Promise<boolean>` prop
- [ ] Display expiration: relative time ("Expires in 3d") with tooltip showing exact date
- [ ] Display fee percentage on listing details
- [ ] Cancel button on own active listings (emerald → destructive for cancel)
- [ ] Expired listings: opacity-50, "Expired" badge, no buy button
- [ ] Create listing form: add `durationDays` input (1-30, default 7) + update price label to "Total Price (USDC)"
- [ ] Two-step approve UX: show "Approve LP Tokens" before "Create Listing" when allowance insufficient
- [ ] Two-step buy UX: show "Approve USDC" before "Buy" when allowance insufficient
- [ ] Sort listings by listingId (matches contract order)
- [ ] Empty state for My Listings per UI-SPEC copywriting
- [ ] Loading skeleton during `isLoading`
- [ ] Wire `needsApproval` from hook into button states

**Verification:** Extended `SecondaryMarketView.test.tsx` covers cancel, expiration, approve flows.

---

### Task 6: Hardhat Deployment + TypeChain

**Priority:** High | **Dependencies:** Task 1 | **Estimate:** 15 min

Add SecondaryMarket.sol to deployment pipeline and regenerate TypeScript types.

**Checklist:**

- [ ] Add deploy script: `contracts/scripts/deploy-secondary-market.ts` — deploy with USDC address, admin, initial fee 150 (1.5%)
- [ ] Write deployed address to `.planning/contract-addresses.json`
- [ ] Export ABI to `src/abis/SecondaryMarket.json`
- [ ] Run `npx hardhat typechain` — regenerate TypeChain types
- [ ] Add `VITE_SECONDARY_MARKET_ADDRESS` to `.env.example`
- [ ] Update `STATE.md` with new contract address entry

**Verification:** `npx hardhat compile` + TypeChain types generated + ABI exported.

---

### Task 7: Contract-Integration Tests (Frontend)

**Priority:** High | **Dependencies:** Task 4, Task 5 | **Estimate:** 40 min

Verify hook + view work together with contract-like behavior.

**Checklist:**

- [ ] Extend `useRealSecondaryMarket.test.ts` (create if not exists):
  - `list()` calls writeContract with correct args
  - `buy()` calls writeContract with correct listingId
  - `cancel()` calls writeContract with correct listingId
  - `needsApproval` reflects allowance state
  - `myListings` filters by wallet address
  - Expired listings get `status: "expired"`
- [ ] Extend `SecondaryMarketView.test.tsx`:
  - Cancel button visible only for own active listings
  - Expired listing shows "Expired" badge, no buy button
  - Create listing form includes durationDays
  - Approve button appears when allowance insufficient
  - Loading skeleton during isLoading
  - Empty state when no myListings
- [ ] All tests use mock implementations (no Hardhat node in CI)
- [ ] `npm test` — 126+ existing + ≥10 new tests pass

**Verification:** `npm test` exit code 0, no coverage regression.

---

### Task 8: Final Verification

**Priority:** Medium | **Dependencies:** All tasks | **Estimate:** 15 min

Full quality gate. Confirm all Phase 5 requirements met.

**Checklist:**

- [ ] `npm run lint` — `tsc --noEmit` clean
- [ ] `npm test` — all tests pass (≥ 136 expected)
- [ ] `npm run build` — vite build succeeds
- [ ] SEC-01 (List LP tokens): Create Listing flow end-to-end
- [ ] SEC-02 (Buy LP tokens): Buy flow end-to-end
- [ ] SEC-03 (Order book): Listings view shows all active offers per project
- [ ] All 16 design decisions (D-01 through D-16) confirmed implemented
- [ ] No `as any`, `@ts-ignore`, `@ts-expect-error` in new code
- [ ] Update `STATE.md` Phase 5 → Complete

**Verification:** Lint clean, tests pass, build succeeds, all SEC requirements demonstrable.

---

## Execution Order

```
Wave 1 (parallel):  Task 1 (Contract)
                    Task 3 (Types) ─── (can start after Task 1 struct design known)

Wave 2 (parallel):  Task 2 (Contract Tests) ─── depend Task 1
                    Task 6 (Deploy + TypeChain) ─── depend Task 1

Wave 3:             Task 4 (Real Hook) ─── depend Task 1, Task 3

Wave 4:             Task 5 (UI Updates) ─── depend Task 3, Task 4

Wave 5:             Task 7 (Integration Tests) ─── depend Task 4, Task 5

Wave 6:             Task 8 (Final Verification) ─── depend ALL
```

## Success Criteria

- [ ] `SecondaryMarket.sol` compiles, passes all contract tests (≥12 cases, 100% line coverage)
- [ ] `useRealSecondaryMarket` replaces stub with real wagmi contract calls
- [ ] `SecondaryMarketView` displays expiration, fee, cancel functionality
- [ ] 126+ existing tests pass + new tests added (≥136 total)
- [ ] `npm run lint` + `npm run build` succeed
- [ ] SEC-01, SEC-02, SEC-03 verified
- [ ] All 16 context decisions (D-01 through D-16) implemented
- [ ] No type safety violationsress homeowner; string metadataURI; uint256 createdAt; uint256 activatedAt; }
    struct InvestorInfo { uint256 deposited; uint256 claimed; }
    event Deposited(address indexed investor, uint256 amount);
    event Withdrawn(address indexed investor, uint256 amount);
    event Repaid(address indexed from, uint256 amount);
    event Claimed(address indexed investor, uint256 principal, uint256 yieldAmount);
    event StatusChanged(ProjectStatus indexed newStatus);
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function repay(uint256 amount) external;
    function claimRewards() external;
    function startFunding() external;
    function activate() external;
    function finalizeProject() external;
    function markDefaulted() external;
    function getProjectInfo() external view returns (ProjectInfo memory);
    function getInvestorInfo(address investor) external view returns (InvestorInfo memory);
    function status() external view returns (ProjectStatus);
}
```

From contracts/contracts/ProjectMarket.sol (patterns to follow):
- Uses AccessControl + ReentrancyGuard + SafeERC20 (for IERC20)
- `bytes32 public constant LIFECYCLE_ROLE = keccak256("LIFECYCLE_ROLE");`
- Constructor validates addresses, grants roles
- `usdc.safeTransferFrom(msg.sender, address(this), amount)` — canonical payment pattern
- `_mint(msg.sender, amount)` — LP token minting (ERC20)
- Custom errors: `error InvalidStatus(); error ZeroAmount(); error InsufficientBalance();`

From src/types.ts — SecondaryListing interface:
```typescript
export interface SecondaryListing {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  price: number;
  seller: string;
  createdAt: string;
}
// To be extended with optional fields (per D-15):
// expirationDate?: string;
// status?: string;       // "active" | "expired" | "cancelled" | "sold"
// fee?: number;
// tokenContract?: string;
```

From src/components/SecondaryMarketView.tsx — current props interface:
```typescript
interface SecondaryMarketViewProps {
  listings: SecondaryListing[];
  myListings: SecondaryListing[];
  projects: Project[];
  lang: Language;
  walletAddress: string;
  onBuy: (listingId: string) => Promise<boolean>;
  onCreateListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
}
// To be extended with:
// onCancelListing?: (listingId: string) => Promise<boolean>;
// onApproveAndList?: (projectId: string, projectName: string, amount: number, price: number, seller: string, durationDays: number) => void;
```

From src/services/real/useRealSecondaryMarket.ts — current stub:
```typescript
export default function useRealSecondaryMarket(walletAddress: string | undefined) {
  return { data: listings, myListings, isLoading, error, mutate, buyListing, createListing };
}
// To be replaced with wagmi hooks returning same interface +
// cancelListing, and refactored createListing → listForSale with approve step
```

From src/services/mock/useMockSecondaryMarket.ts — reference interface:
```typescript
interface UseMockSecondaryMarketReturn {
  data: SecondaryListing[];
  myListings: SecondaryListing[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  buyListing: (listingId: string) => Promise<boolean>;
  createListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
}
```

From src/services/real/contracts.ts:
```typescript
export const CONTRACTS = {
  mockUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  factory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
} as const;
// Add: secondaryMarket: "<address>" after deployment
```

From src/services/real/useRealLending.ts — wagmi hook pattern:
```typescript
import { useCallback } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { type Address, type Abi } from "viem";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";

const { writeContractAsync } = useWriteContract();
// Two-step: approve → writeContractAsync
await writeContractAsync({
  address: CONTRACTS.mockUSDC as Address,
  abi: MockUSDCABI,
  functionName: "approve",
  args: [marketAddr, usdcAmount],
  chainId: HARDHAT_CHAIN_ID,
});
// Then actual action
await writeContractAsync({ ... });
// Wait for receipt
const { data: hash } = useWaitForTransactionReceipt({ hash });
```

From $AGENTS.md (component architecture):
- Functional components, hooks at top, JSX return
- Presentational pattern: props-in/events-out
- Mock hooks pattern: `{ data, isLoading, error, mutate, ...actions }`
- Toast pattern: Context API, `useToast()` returns `addToast(type, message)`
</interfaces>
</context>

---

## Wave Structure

| Wave | Plans | Description | Autonomous |
|------|-------|-------------|------------|
| 1 | 05-01 | Solidity contract + deployment + type generation | yes |
| 2 | 05-02 | Frontend types + wagmi hook + translations | yes |
| 3 | 05-03 | UI evolution + integration tests | no (has UX checkpoint) |

---

## Plan 5-1: Solidity Contract Layer

**Wave:** 1
**Autonomous:** yes
**Depends on:** Phase 3 (ProjectMarket contract patterns, USDC, factory addresses)
**Files modified:**
- `contracts/contracts/SecondaryMarket.sol` (CREATE)
- `contracts/contracts/interfaces/ISecondaryMarket.sol` (CREATE)
- `contracts/test/SecondaryMarket.test.ts` (CREATE)
- `contracts/scripts/deploy-secondary-market.ts` (CREATE)
- `.planning/contract-addresses.md` (APPEND)
- `src/abis/SecondaryMarket.abi.json` (GENERATED via TypeChain)
- `contracts/typechain-types/` (GENERATED via TypeChain)

<task type="auto" tdd="true">
<name>Task 5.1.1 — Write ISecondaryMarket.sol interface + SecondaryMarket.sol implementation</name>
<files>
contracts/contracts/interfaces/ISecondaryMarket.sol
contracts/contracts/SecondaryMarket.sol
</files>
<behavior>
- Test 1: list() transfers LP tokens from seller to contract and emits Listed with correct fields
- Test 2: buy() transfers USDC from buyer (price + fee), sends price to seller, fee to protocol, LP tokens to buyer
- Test 3: cancel() returns LP tokens to seller or admin (if expired) and emits Cancelled
- Test 4: Self-purchase reverts with error
- Test 5: Expired listing cannot be purchased (reverts)
- Test 6: Zero-amount listing reverts
- Test 7: getListings() returns all listings; getListing(id) returns single listing
- Test 8: getInvestorOfferings(address) returns only that seller's active listings
- Test 9: Fee is correctly calculated as price * feeBasisPoints / 10000
- Test 10: Duplicate cancel reverts (listing already inactive)
- Test 11: feeBasisPoints is updatable by FEE_ROLE admin only
</behavior>
<action>
### ISecondaryMarket.sol
Create `contracts/contracts/interfaces/ISecondaryMarket.sol` following the IProjectMarket.sol pattern:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISecondaryMarket {
    struct Listing {
        uint256 id;
        address seller;
        address tokenContract;   // ProjectMarket LP token (ERC20)
        uint256 amount;          // LP token amount to sell
        uint256 price;           // Total USDC price for whole amount (D-11: total, not per-unit)
        uint256 expiresAt;       // block.timestamp deadline
        bool active;
    }

    event Listed(uint256 indexed listingId, address indexed seller, address indexed tokenContract, uint256 amount, uint256 price, uint256 expiresAt);
    event Purchased(uint256 indexed listingId, address indexed buyer, address indexed tokenContract, uint256 amount, uint256 price, uint256 fee);
    event Cancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps, address indexed updater);

    function list(address tokenContract, uint256 amount, uint256 price, uint256 durationDays) external returns (uint256 listingId);
    function buy(uint256 listingId) external;
    function cancel(uint256 listingId) external;

    function getListings() external view returns (Listing[] memory);
    function getListing(uint256 listingId) external view returns (Listing memory);
    function getInvestorOfferings(address seller) external view returns (Listing[] memory);

    function nextListingId() external view returns (uint256);
    function feeBasisPoints() external view returns (uint256);
    function feeCollector() external view returns (address);
    function usdc() external view returns (address);
}
```

### SecondaryMarket.sol
Create `contracts/contracts/SecondaryMarket.sol` following ProjectMarket.sol patterns:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISecondaryMarket.sol";

contract SecondaryMarket is ISecondaryMarket, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ROLE = keccak256("FEE_ROLE");

    IERC20 public immutable override usdc;
    address public immutable override feeCollector;

    uint256 public override feeBasisPoints; // 100 = 1% (D-08)
    uint256 public override nextListingId;

    mapping(uint256 => Listing) private _listings;
    mapping(address => uint256[]) private _sellerListings; // for getInvestorOfferings

    // Custom errors
    error ListingInactive();
    error ListingExpired();
    error SelfPurchase();
    error ZeroAmount();
    error ZeroPrice();
    error NotSeller();
    error FeeTooHigh();  // > 20% (2000 bps)

    // Constructor
    constructor(address _usdc, address _feeCollector, uint256 _feeBasisPoints) {
        require(_usdc != address(0), "Invalid USDC");
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_feeBasisPoints <= 2000, "Fee too high"); // max 20%

        usdc = IERC20(_usdc);
        feeCollector = _feeCollector;
        feeBasisPoints = _feeBasisPoints;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FEE_ROLE, msg.sender);
    }

    // --- Write Functions ---

    function list(address tokenContract, uint256 amount, uint256 price, uint256 durationDays)
        external override nonReentrant returns (uint256 listingId)
    {
        if (amount == 0) revert ZeroAmount();
        if (price == 0) revert ZeroPrice();
        if (tokenContract == address(0)) revert("Invalid token");

        listingId = nextListingId;
        nextListingId++;

        uint256 expiresAt = block.timestamp + durationDays * 1 days;

        // Escrow LP tokens (D-05)
        IERC20(tokenContract).safeTransferFrom(msg.sender, address(this), amount);

        _listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            tokenContract: tokenContract,
            amount: amount,
            price: price,
            expiresAt: expiresAt,
            active: true
        });

        _sellerListings[msg.sender].push(listingId);

        emit Listed(listingId, msg.sender, tokenContract, amount, price, expiresAt);
    }

    function buy(uint256 listingId) external override nonReentrant {
        Listing storage listing = _listings[listingId];
        if (!listing.active) revert ListingInactive();
        if (block.timestamp > listing.expiresAt) revert ListingExpired();
        if (msg.sender == listing.seller) revert SelfPurchase();

        // Mark inactive FIRST (prevents reentrancy across 3 transfers)
        listing.active = false;

        // Calculate fee (D-08: fee added on top to buyer)
        uint256 fee = (listing.price * feeBasisPoints) / 10000;

        // Transfer USDC from buyer: price goes to seller (D-12)
        usdc.safeTransferFrom(msg.sender, listing.seller, listing.price);

        // Fee goes to protocol (D-12)
        if (fee > 0) {
            usdc.safeTransferFrom(msg.sender, feeCollector, fee);
        }

        // Transfer LP tokens from escrow to buyer (D-05)
        IERC20(listing.tokenContract).safeTransfer(msg.sender, listing.amount);

        emit Purchased(listingId, msg.sender, listing.tokenContract, listing.amount, listing.price, fee);
    }

    function cancel(uint256 listingId) external override nonReentrant {
        Listing storage listing = _listings[listingId];
        if (!listing.active) revert ListingInactive();

        // Only seller or admin can cancel (admin can cancel expired)
        bool isExpired = block.timestamp > listing.expiresAt;
        if (msg.sender != listing.seller && !isExpired && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotSeller();
        }
        // Even if expired, non-seller needs admin role
        if (isExpired && msg.sender != listing.seller && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotSeller();
        }

        listing.active = false;

        // Return LP tokens to seller (D-07)
        IERC20(listing.tokenContract).safeTransfer(listing.seller, listing.amount);

        emit Cancelled(listingId);
    }

    // --- Admin Functions ---

    function updateFee(uint256 newFeeBps) external onlyRole(FEE_ROLE) {
        if (newFeeBps > 2000) revert FeeTooHigh();
        feeBasisPoints = newFeeBps;
        emit FeeUpdated(newFeeBps, msg.sender);
    }

    // --- View Functions ---

    function getListings() external view override returns (Listing[] memory) {
        uint256 count = nextListingId;
        Listing[] memory all = new Listing[](count);
        for (uint256 i = 0; i < count; i++) {
            all[i] = _listings[i];
        }
        return all;
    }

    function getListing(uint256 listingId) external view override returns (Listing memory) {
        return _listings[listingId];
    }

    function getInvestorOfferings(address seller) external view override returns (Listing[] memory) {
        uint256[] storage sellerIds = _sellerListings[seller];
        uint256 activeCount = 0;
        for (uint256 i = 0; i < sellerIds.length; i++) {
            if (_listings[sellerIds[i]].active) activeCount++;
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < sellerIds.length; i++) {
            if (_listings[sellerIds[i]].active) {
                result[idx] = _listings[sellerIds[i]];
                idx++;
            }
        }
        return result;
    }
}
```

**Implementation notes:**
- Follow ProjectMarket's exact Solidity version (0.8.24), optimizer settings (200 runs), and OpenZeppelin version
- Use SafeERC20 (imported as `using SafeERC20 for IERC20;`) — exactly like ProjectMarket.sol line 12
- Mark listing inactive BEFORE token transfers in buy() — CEI pattern prevents reentrancy
- Use `nonReentrant` on list(), buy(), cancel() — 3 token transfers in buy() make this critical
- Fee uses basis points (100 = 1%) matching RESEARCH-05.md §1 precision spec
- `_sellerListings` mapping tracks seller⇒listing IDs for `getInvestorOfferings()` — avoids O(n) scan of all listings
</action>
<verify>
<automated>cd contracts && npx hardhat compile 2>&1 | tail -5</automated>
</verify>
<done>Contract compiles with 0 errors. Interface and contract match exactly.</done>
</task>

<task type="tdd">
<name>Task 5.1.2 — Write Hardhat test suite for SecondaryMarket.sol</name>
<files>
contracts/test/SecondaryMarket.test.ts
</files>
<behavior>
- Test 1: list() transfers LP tokens to contract, emits Listed with correct listingId/seller/token/amount/price/expiresAt
- Test 2: buy() transfers USDC (price + 1% fee) from buyer → seller gets price, protocol gets fee, LP tokens go to buyer
- Test 3: cancel() returns LP tokens to seller, emits Cancelled, listing becomes inactive
- Test 4: Self-purchase (seller tries to buy own listing) reverts with SelfPurchase
- Test 5: Expired listing reverts on buy() with ListingExpired
- Test 6: Zero-amount listing reverts with ZeroAmount
- Test 7: Zero-price listing reverts with ZeroPrice
- Test 8: getListings() returns correct array length and fields for 0, 1, and multiple listings
- Test 9: getInvestorOfferings returns only active listings for given seller
- Test 10: Double-cancel reverts with ListingInactive
- Test 11: updateFee() by FEE_ROLE updates feeBasisPoints; non-admin reverts
- Test 12: FeeTooHigh reverts when fee > 2000 bps
- Test 13: Deploy with zero USDC address reverts
- Test 14: Partial purchases work: new listing for partial amount, buy succeeds
- Test 15: Admin can cancel expired listing (not their own)
</behavior>
<action>
Create `contracts/test/SecondaryMarket.test.ts` following the exact conventions from `contracts/test/ProjectMarket.test.ts`:

**Setup pattern** (mirror ProjectMarket.test.ts):
1. Get 5 signers: admin, seller, buyer, investor2, stranger
2. Deploy MockUSDC, mint USDC to all non-admin signers
3. Deploy ProjectMarket for LP token creation (admin creates, admin starts funding, investors deposit to get LP tokens)
4. Deploy SecondaryMarket with USDC address, feeCollector (admin), 100 feeBasisPoints (1%)

**Test pattern** (mirror existing test file's chai + ethers style):
- Use `ethers.parseUnits("...", 6)` for USDC amounts (standard from existing tests)
- Use `await market.connect(seller).list(tokenAddr, amount, price, duration)` — note: seller needs LP tokens first
- For LP token acquisition: investor deposits USDC into ProjectMarket → receives LP tokens → approves SecondaryMarket
- Test time manipulation: `await ethers.provider.send("evm_increaseTime", [days * 86400])` + `evm_mine` for expiry tests
- Test event emission: `await expect(tx).to.emit(contract, "Listed").withArgs(...)`
- Test reverts: `await expect(tx).to.be.revertedWithCustomError(contract, "ListingInactive")`

**Key test coverage:**
- Three-way transfer verification in buy(): USDC buyer→seller, USDC buyer→protocol, LP contract→buyer
- Fee = price * 100 / 10000 = price * 0.01 for 1%
- Seller receives exact price; protocol receives exactly fee
- Listing.active == false after buy or cancel
- Purchase of expired listing must fail
- Admin-only updateFee, FEE_ROLE gated

**Edge cases to cover:**
- Partial sale (list half of LP balance)
- Buy when buyer has insufficient USDC (must revert naturally — don't catch, test via assertion)
- Cancel when no LP tokens in contract (admin called cancel for expired listing — already returned)
- Multiple listings from same seller → getInvestorOfferings returns all
- Fee change between listing creation and purchase (fee reads from contract state at buy time)

**Pre-approval flow in tests:**
- Before `list()`: seller calls `lpToken.approve(secondaryMarket.address, amount)`
- Before `buy()`: buyer calls `usdc.approve(secondaryMarket.address, price + fee)`
</action>
<verify>
<automated>cd contracts && npx hardhat test test/SecondaryMarket.test.ts 2>&1 | tail -20</automated>
</verify>
<done>All 15+ tests pass. 100% line coverage on SecondaryMarket.sol. Branch coverage >= 80%.</done>
</task>

<task type="auto">
<name>Task 5.1.3 — Write deploy script + generate TypeChain types + copy ABI</name>
<files>
contracts/scripts/deploy-secondary-market.ts
.planning/contract-addresses.md
src/abis/SecondaryMarket.abi.json
</files>
<action>
**Deploy script** — Create `contracts/scripts/deploy-secondary-market.ts` following `deploy-localhost.ts` pattern:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const usdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // from existing deploy
  const feeCollector = deployer.address;
  const feeBasisPoints = 100; // 1%

  const SecondaryMarket = await ethers.getContractFactory("SecondaryMarket");
  const market = await SecondaryMarket.deploy(usdcAddress, feeCollector, feeBasisPoints);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("SecondaryMarket deployed to:", marketAddress);

  // Write address to contracts.ts compatible output
  const output = {
    chainId: 31337,
    secondaryMarket: marketAddress,
  };
  const outputPath = path.join(__dirname, "../../.planning/contract-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log("Addresses written to", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**contract-addresses.md** — Update `.planning/contract-addresses.md`:
```
## Phase 5: Secondary Market

| Contract | Address | Network |
|----------|---------|---------|
| SecondaryMarket | `<deployed-address>` | Hardhat localhost (31337) |
```

**TypeChain regeneration:**
1. Run `cd contracts && npx hardhat typechain` — regenerates all typings including SecondaryMarket
2. Verify output exists: `ls contracts/typechain-types/contracts/SecondaryMarket.sol/`

**ABI export:**
1. Copy ABI: `cp contracts/artifacts/contracts/SecondaryMarket.sol/SecondaryMarket.json src/abis/SecondaryMarket.abi.json`
2. The ABI JSON includes abi, bytecode, deployedBytecode. Frontend only needs `.abi`.
3. Strip non-ABI fields if desired, or import like other ABI files (existing pattern: `import _MarketABI from "../../abis/ProjectMarket.abi.json"`)

**contracts.ts update** — Edit `src/services/real/contracts.ts` to add the secondaryMarket address:
```typescript
export const CONTRACTS = {
  mockUSDC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  factory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  secondaryMarket: "<deployed-address>",
} as const;
```
</action>
<verify>
<automated>
cd contracts && npx hardhat typechain 2>&1 | tail -3 && ls contracts/typechain-types/contracts/SecondaryMarket.sol/ 2>&1 | head -5
</automated>
</verify>
<done>TypeChain types generated at `contracts/typechain-types/contracts/SecondaryMarket.sol/`. ABI copied to `src/abis/SecondaryMarket.abi.json`. contracts.ts updated with address.</done>
</task>

---

## Plan 5-2: Frontend Types + Wagmi Hook Integration

**Wave:** 2
**Autonomous:** yes
**Depends on:** Plan 5-1 (ABI, TypeChain types)
**Files modified:**
- `src/types.ts` (EDIT)
- `src/translations.ts` (EDIT)
- `src/services/real/useRealSecondaryMarket.ts` (REWRITE)
- `src/services/real/contracts.ts` (EDIT)

<task type="auto">
<name>Task 5.2.1 — Extend SecondaryListing type + add translation keys</name>
<files>
src/types.ts
src/translations.ts
</files>
<action>
### src/types.ts — Extend SecondaryListing (per D-15)

Add optional fields to preserve backward compatibility with mock data:

```typescript
export interface SecondaryListing {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  price: number;
  seller: string;
  createdAt: string;
  // Phase 5 extensions (per D-15)
  expirationDate?: string;   // ISO date string
  status?: string;            // "active" | "expired" | "cancelled" | "sold"
  fee?: number;               // USDC fee amount (for display)
  totalCost?: number;         // price + fee (total buyer pays)
  tokenContract?: string;     // LP token contract address
  listingContract?: string;   // SecondaryMarket contract address (for on-chain ID resolution)
}
```

### src/translations.ts — Add new keys for cancel/fee/expiration

Add to the English block (around line 153) and Thai block (around line 293):

**English additions (after `smProject: "Project"`):**
```typescript
    // Secondary Market (Phase 5 additions)
    smCancelListing: "Cancel Listing",
    smCancelSuccess: "Listing cancelled. LP tokens returned to your wallet.",
    smCancelConfirm: "Cancel Listing: This will return your LP tokens to your wallet. This action cannot be undone.",
    smCreateSuccess: "Listing created successfully!",
    smFee: "Fee",
    smFeePercent: "Fee ({fee}%)",
    smTotalCost: "Total Cost",
    smFaceValue: "Face Value",
    smDuration: "Duration (Days)",
    smExpires: "Expires",
    smDays: "days",
    smStatus: "Status",
    smActive: "Active",
    smExpired: "Expired",
    smNoMyListings: "You have no active listings.",
    smApproveFirst: "Step 1: Approve LP Tokens",
    smListStep: "Step 2: Create Listing",
    smApproveAndList: "Approve & List",
    smApproveOnly: "Approve",
    smMyPositions: "My LP Positions",
    smListableAmount: "Listable Amount",
```

**Thai additions (after `smProject: "โครงการ"`):**
```typescript
    // Secondary Market (Phase 5 additions)
    smCancelListing: "ยกเลิกรายการ",
    smCancelSuccess: "ยกเลิกรายการแล้ว โทเค็น LP ถูกส่งคืนกระเป๋าของคุณ",
    smCancelConfirm: "ยกเลิกรายการ: การดำเนินการนี้จะส่งคืนโทเค็น LP ของคุณกลับไปยังกระเป๋า การดำเนินการนี้ไม่สามารถยกเลิกได้",
    smCreateSuccess: "สร้างรายการสำเร็จ!",
    smFee: "ค่าธรรมเนียม",
    smFeePercent: "ค่าธรรมเนียม ({fee}%)",
    smTotalCost: "ราคารวม",
    smFaceValue: "มูลค่าที่ตราไว้",
    smDuration: "ระยะเวลา (วัน)",
    smExpires: "หมดอายุ",
    smDays: "วัน",
    smStatus: "สถานะ",
    smActive: "ใช้งานอยู่",
    smExpired: "หมดอายุ",
    smNoMyListings: "คุณไม่มีรายการที่ใช้งานอยู่",
    smApproveFirst: "ขั้นตอนที่ 1: อนุมัติโทเค็น LP",
    smListStep: "ขั้นตอนที่ 2: สร้างรายการ",
    smApproveAndList: "อนุมัติและสร้างรายการ",
    smApproveOnly: "อนุมัติ",
    smMyPositions: "สถานะ LP ของฉัน",
    smListableAmount: "จำนวนที่สามารถขายได้",
```
</action>
<verify>
<automated>
npx tsc --noEmit 2>&1 | head -10 && grep -c "smCancelListing" src/translations.ts</automated>
</verify>
<done>TypeScript compiles with 0 errors. All new translation keys present in both en and th blocks.</done>
</task>

<task type="auto" tdd="true">
<name>Task 5.2.2 — Rewrite useRealSecondaryMarket with wagmi hooks</name>
<files>
src/services/real/useRealSecondaryMarket.ts
</files>
<behavior>
- Test 1: Hook returns { data, myListings, isLoading, error, mutate, buyListing, createListing, cancelListing }
- Test 2: listForSale calls approve then list on contract (two-step) — verify correct functionName and args
- Test 3: buyListing calls contract buy() with listingId, returns boolean
- Test 4: cancelListing calls contract cancel() with listingId, returns boolean
- Test 5: Hook fetches listing count and all listings via useReadContract(s)
- Test 6: myListings is derived by filtering data by walletAddress lowercased
- Test 7: Expired listings are filtered out from display data (client-side)
- Test 8: Error state propagates from wagmi to hook's error field
- Test 9: Loading state is derived from wagmi's isPending/isConfirming
- Test 10: Listing data is transformed from chain format (bigint → number, convert decimals)
</behavior>
<action>
Rewrite `src/services/real/useRealSecondaryMarket.ts` following the exact patterns from `src/services/real/useRealLending.ts`:

```typescript
import { useCallback, useMemo } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address, type Abi } from "viem";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _SecondaryMarketABI from "../../abis/SecondaryMarket.abi.json";
import type { SecondaryListing } from "../../types";

const SecondaryMarketABI = _SecondaryMarketABI as Abi;

const SIX_DECIMALS = 1_000_000;

interface UseRealSecondaryMarketReturn {
  data: SecondaryListing[];
  myListings: SecondaryListing[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  buyListing: (listingId: string) => Promise<boolean>;
  createListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
  cancelListing: (listingId: string) => Promise<boolean>;
}

export default function useRealSecondaryMarket(walletAddress: string | undefined): UseRealSecondaryMarketReturn {
  const marketAddr = CONTRACTS.secondaryMarket as Address;

  // --- Read: Get listing count ---
  const { data: countData, refetch: refetchCount } = useReadContract({
    address: marketAddr,
    abi: SecondaryMarketABI,
    functionName: "nextListingId",
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!walletAddress },
  });

  const listingCount = countData ? Number(countData) : 0;

  // --- Read: Get individual listings ---
  // Dynamic approach: getListings() returns all listings in one call if the contract
  // has getListings(). Otherwise, we read each listing by index.
  // Contract has getListings() — use it.
  const { data: listingsData, refetch: refetchListings, isLoading: isReading, error: readError } = useReadContract({
    address: marketAddr,
    abi: SecondaryMarketABI,
    functionName: "getListings",
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: listingCount > 0 && !!walletAddress },
  });

  // --- Writes ---
  const { writeContractAsync, data: writeHash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: writeHash });

  // --- Transform on-chain listings to SecondaryListing[] ---
  const allListings: SecondaryListing[] = useMemo(() => {
    if (!listingsData || !Array.isArray(listingsData)) return [];

    const rawListings = listingsData as Array<{
      id: bigint;
      seller: Address;
      tokenContract: Address;
      amount: bigint;
      price: bigint;
      expiresAt: bigint;
      active: boolean;
    }>;

    return rawListings
      .filter(l => l.active) // Only active listings
      .map(l => {
        const amount = Number(l.amount) / SIX_DECIMALS;
        const price = Number(l.price) / SIX_DECIMALS;
        const feeRate = 0.01; // 1% — could also read from contract
        const fee = price * feeRate;
        return {
          id: l.id.toString(),
          projectId: "", // Resolved from tokenContract via mapping in App.tsx or higher-level hook
          projectName: `LP Token ${l.tokenContract.slice(0, 6)}...${l.tokenContract.slice(-4)}`,
          amount,
          price,
          totalCost: price + fee,
          fee,
          seller: l.seller,
          tokenContract: l.tokenContract,
          createdAt: new Date(Number(l.expiresAt) * 1000 - 30 * 24 * 60 * 60 * 1000).toISOString(), // estimated
          expirationDate: new Date(Number(l.expiresAt) * 1000).toISOString(),
          status: "active",
        } as SecondaryListing;
      });
  }, [listingsData]);

  const myListings = useMemo(
    () => allListings.filter(l => l.seller.toLowerCase() === (walletAddress ?? "").toLowerCase()),
    [allListings, walletAddress]
  );

  // --- Actions ---
  const buyListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!walletAddress) return false;
    try {
      // Buyer needs to approve USDC spending first (amount + fee)
      // For simplicity, assume heavy approval or single-call pattern
      await writeContractAsync({
        address: marketAddr,
        abi: SecondaryMarketABI,
        functionName: "buy",
        args: [BigInt(listingId)],
        chainId: HARDHAT_CHAIN_ID,
      });
      return true;
    } catch {
      return false;
    }
  }, [walletAddress, marketAddr, writeContractAsync]);

  const createListing = useCallback(
    async (projectId: string, projectName: string, amount: number, price: number, seller: string) => {
      if (!walletAddress) return;
      // Two-step: (1) approve LP tokens to SecondaryMarket (2) call list()
      // The approve step should happen in the UI before calling this
      // This function handles the list() call
      // tokenAddress needs to be resolved from projectId (Phase 3 pattern)
      try {
        // Step 1: approve LP token spend
        // Step 2: call list
        const durationDays = 30n; // default 30 days — should come from UI
        await writeContractAsync({
          address: marketAddr,
          abi: SecondaryMarketABI,
          functionName: "list",
          args: [
            "0x0" as Address, // placeholder — needs real token address
            BigInt(Math.round(amount * SIX_DECIMALS)),
            BigInt(Math.round(price * SIX_DECIMALS)),
            durationDays,
          ],
          chainId: HARDHAT_CHAIN_ID,
        });
      } catch {
        // error handled by caller
      }
    },
    [walletAddress, marketAddr, writeContractAsync]
  );

  const cancelListing = useCallback(async (listingId: string): Promise<boolean> => {
    if (!walletAddress) return false;
    try {
      await writeContractAsync({
        address: marketAddr,
        abi: SecondaryMarketABI,
        functionName: "cancel",
        args: [BigInt(listingId)],
        chainId: HARDHAT_CHAIN_ID,
      });
      return true;
    } catch {
      return false;
    }
  }, [walletAddress, marketAddr, writeContractAsync]);

  const mutate = useCallback(() => {
    refetchCount();
    refetchListings();
  }, [refetchCount, refetchListings]);

  const derivedError = readError ? (readError as Error).message : writeError ? (writeError as Error).message : null;

  return {
    data: allListings,
    myListings,
    isLoading: isReading || isWriting || isConfirming,
    error: derivedError,
    mutate,
    buyListing,
    createListing,
    cancelListing,
  };
}
```

**Implementation notes:**
- Follow the exact wagmi hook pattern from `useRealLending.ts`: `useReadContract` for reads, `useWriteContract` for writes
- Use `useMemo` for data transformation (same as useRealLending's `rawResults.map(...)` pattern)
- Token contract address resolution (mapping listing.tokenContract → project) is handled in a higher-level composable or App.tsx — not in this hook (SRP)
- The `createListing` function signature accepts same params as mock hook for backward compatibility. UI calls approve separately then calls this for list()
- BigInt arithmetic uses explicit `Number()` conversion with `/ 1_000_000` for 6-decimal USDC
- Error state derived from both read and write errors, matching `{ data, isLoading, error, mutate }` contract

**Critical: The hook MUST export the same shape as useMockSecondaryMarket.**
</action>
<verify>
<automated>
npx tsc --noEmit 2>&1 | head -15</automated>
</verify>
<done>TypeScript compiles with 0 errors. Hook returns `{ data, myListings, isLoading, error, mutate, buyListing, createListing, cancelListing }` matching mock hook interface.</done>
</task>

---

## Plan 5-3: UI Evolution + Integration Testing

**Wave:** 3
**Autonomous:** no (has UX checkpoint)
**Depends on:** Plan 5-2 (updated hook, types, translations)
**Files modified:**
- `src/components/SecondaryMarketView.tsx` (EDIT)
- `src/components/SecondaryMarketView.test.tsx` (EDIT or CREATE)
- `src/App.tsx` (EDIT — minor, pass cancelListing prop)

<task type="auto">
<name>Task 5.3.1 — Evolve SecondaryMarketView with cancel, fee display, expiration, and create-with-duration</name>
<files>
src/components/SecondaryMarketView.tsx
</files>
<action>
Evolve `SecondaryMarketView.tsx` in-place (per D-13). Make targeted changes to the existing file — do NOT rewrite from scratch.

**Props interface changes:**
```typescript
interface SecondaryMarketViewProps {
  listings: SecondaryListing[];
  myListings: SecondaryListing[];
  projects: Project[];
  lang: Language;
  walletAddress: string;
  onBuy: (listingId: string) => Promise<boolean>;
  onCreateListing: (projectId: string, projectName: string, amount: number, price: number, seller: string) => void;
  // Phase 5 additions (D-14: props-in/events-out stays)
  onCancelListing?: (listingId: string) => Promise<boolean>;
  onApproveAndList?: (projectId: string, projectName: string, amount: number, price: number, seller: string, durationDays: number, tokenContract: string) => Promise<void>;
  userLpPositions?: Array<{ projectId: string; projectName: string; lpBalance: number; tokenContract: string }>;
  feePercent?: number;
}
```

**Specific UI changes to make:**

1. **Listing card fee display** — In the listing card render section (around lines 148-171), after the total USDC line, add:
   - If listing.fee is present: show "Fee: {fee} USDC ({feePercent}%)" in text-white/30
   - If listing.totalCost is present: show "Total: {totalCost} USDC" replacing/adjacent to current total

2. **Expiration badge** — In the listing card metadata section:
   - If listing.expirationDate is present: show calendar icon + formatted expiry date
   - If expired (client-side filter): show "Expired" badge in red-500

3. **Cancel button for seller's own listings** — In "My Listings" section (around lines 178+):
   - Each myListing card gets a "Cancel Listing" button (red-500/red-400 hover)
   - onPress → shows confirmation dialog (reuse existing delete/confirm pattern from admin panel)
   - On confirm → calls onCancelListing(listing.id)
   - Follows same loading pattern as buy (setCancelLoading per listingId)

4. **Create listing form enhancement** — In the create form section (lines 81-130):
   - Add "Duration (Days)" input field (number, min 1, default 30)
   - Change price label from "Price (USDC / LP)" to "Total Price (USDC)" (per D-11: total, not per-unit)
   - Add user's LP positions dropdown showing `userLpPositions` with listable balance
   - Add fee preview text: "Fee: {feePercent}% — Total buyer pays: {price + fee} USDC"

5. **Create listing flow — two-step** (per RESEARCH-05.md §5 Frontend pitfall #1):
   - Step 1: "Approve LP Tokens" button (calls ERC20 approve on the LP token for SecondaryMarket)
   - Step 2: "Create Listing" button (calls createListing/onCreateListing)
   - Step 1 becomes disabled after approval; Step 2 enabled
   - Or: single "Approve & List" button that does approve → then list sequentially (like useRealLending.ts deposit pattern with approve+writeContractAsync chaining)

6. **Fee column in listing details** — In the listing metadata row (line 150-157):
   - Add "Fee: {feePercent}%" display next to price
   - Add "Total: {price + fee} USDC" as the buyer-facing cost

**Do NOT change:**
- The component's presentational architecture (per D-14)
- Existing test behavior (per D-16)
- Overall layout structure (emerald-600 buttons, motion animations, grid layout)
- Empty state handling (keep "No Listings Available" per UI-SPEC.md)
</action>
<verify>
<automated>
npx tsc --noEmit 2>&1 | head -10</automated>
</verify>
<done>Component compiles with 0 TS errors. All new props optional (backward compatible). Cancel, fee display, expiration, and two-step create flow functional.</done>
</task>

<task type="auto">
<name>Task 5.3.2 — Wire cancelListing + approveAndList through App.tsx + extend existing tests</name>
<files>
src/App.tsx
src/components/SecondaryMarketView.test.tsx
</files>
<action>
### App.tsx wiring (minor changes)
Current wiring in App.tsx calls `useRealSecondaryMarket(walletAddress)` and spreads return to `<SecondaryMarketView>`. Add the new prop mappings:

1. Import `cancelListing` from the hook return destructuring
2. Pass `onCancelListing={cancelListing}` to `<SecondaryMarketView>`
3. Add optional `feePercent` prop (hardcode `feePercent={1}` for now — matches 1% contract default)
4. (Optional) Pass user LP positions from useRealPortfolio or useRealSecondaryMarket for the create form dropdown

### Test extensions
Create or edit `src/components/SecondaryMarketView.test.tsx`:

1. **Existing tests must still pass** (per D-16) — do not modify existing test cases, only add new `describe` blocks

2. **New test cases for Phase 5 features:**
   - Renders "Fee: 1%" text when listing has fee data
   - Renders expiration date when listing has expirationDate
   - Shows "Expired" badge for expired listings (client-side filter)
   - Cancel button appears for seller's own listings
   - Cancel button triggers onCancelListing callback
   - Create form shows duration input
   - Shows two-step approve/list flow when no LP approval given
   - Shows fee preview in create form total calculation

**Test file should follow existing testing patterns:**
- import { render, screen, fireEvent } from tests setup
- Mock child components (Toast)
- Use spy functions for callbacks
- Provide mock listings with new optional fields

### Verify mock hook still works alongside real hook
- `src/services/mock/useMockSecondaryMarket.ts` already returns `buyListing` and `createListing`
- No changes needed to mock hook — it already matches the interface
- App.tsx switches between mock and real via environment or import (existing pattern)
</action>
<verify>
<automated>
npx vitest run src/components/SecondaryMarketView.test.tsx 2>&1 | tail -15</automated>
</verify>
<done>All existing tests pass. New Phase 5 tests pass. TypeScript compiles with 0 errors.</done>
</task>

---

## Wave Execution Order

```
Wave 1 (contract layer):
  Task 5.1.1 → Task 5.1.2 → Task 5.1.3
  (sequential: contract must compile before tests, tests pass before deploy)

Wave 2 (frontend integration):
  Task 5.2.1 → Task 5.2.2
  (sequential: types must exist before hook compiles)

Wave 3 (UI + tests):
  Task 5.3.1 → Task 5.3.2
  (sequential: UI evolves before integration tests)
```

**Parallelization notes:**
- Wave 1 and Wave 2 could theoretically run in parallel if ABIs are pre-generated, but TypeChain regeneration after Task 5.1.3 makes Wave 1 → Wave 2 dependent.
- Within each wave, tasks are sequential due to compile/test dependencies.

---

## Threat Model

### Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User → SecondaryMarket contract | Untrusted user calls list/buy/cancel — reentrancy, frontrunning, griefing |
| SecondaryMarket → LP token (ProjectMarket) | Cross-contract call — LP token could be malicious if arbitrary address passed |
| SecondaryMarket → USDC | Cross-contract call — USDC transfer must not fail silently |

### STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Spoofing | SecondaryMarket.list() | mitigate | `safeTransferFrom` verifies caller owns tokens (standard ERC20 check). No identity spoofing possible on-chain. |
| T-05-02 | Tampering | SecondaryMarket.buy() | mitigate | CEI pattern: mark listing inactive BEFORE token transfers. ReentrancyGuard on all 3 write functions. |
| T-05-03 | Repudiation | Events | mitigate | All state-changing operations emit events (Listed, Purchased, Cancelled, FeeUpdated) — non-repudiable on-chain. |
| T-05-04 | Information Disclosure | getInvestorOfferings | accept | Anyone can see any seller's listings. This is intentional transparency — secondary market data is public. |
| T-05-05 | Denial of Service | SecondaryMarket.buy() — 3 token transfers | mitigate | Gas limits bounded: 3 known ERC20 transfers (~180K gas). No unbounded loops in write functions. |
| T-05-06 | Elevation of Privilege | updateFee() | mitigate | `onlyRole(FEE_ROLE)` gates fee changes. DEFAULT_ADMIN_ROLE and FEE_ROLE granted at construction. |
| T-05-07 | Frontrunning | buy() — buyer A vs buyer B | accept | First TX to confirm wins. V2 could add commit-reveal for fair ordering. Acceptable for v1 P2P offers. |
| T-05-08 | Fee Manipulation | Fee > 100% | mitigate | Constructor + updateFee cap at 2000 bps (20%). Constructor validates. |
| T-05-09 | LP Token Impersonation | list() with fake token | mitigate | No verify — accept risk: fake tokens won't have USDC backing, so buying them wastes gas. Consider allowlist in V2. |
| T-05-10 | Reentrancy on Expired Listing | cancel() by admin + seller | mitigate | `nonReentrant` modifier. Listing marked inactive before token transfer — CEI pattern. |
| T-05-11 | USDC Transfer Failure | buy() — buyer lacks USDC | mitigate | `safeTransferFrom` reverts on failure. Error propagates naturally — no silent partial execution. |
| T-05-12 | Fee Collector Address | feeCollector() | accept | Immutable address set in constructor. If compromised, admin must deploy new SecondaryMarket with new collector. |

---

## Verification

```bash
# Plan 5-1: Contract Layer
cd contracts && npx hardhat compile
cd contracts && npx hardhat test test/SecondaryMarket.test.ts
cd contracts && npx hardhat typechain
ls contracts/typechain-types/contracts/SecondaryMarket.sol/
ls src/abis/SecondaryMarket.abi.json

# Plan 5-2: Frontend Integration
npx tsc --noEmit
grep -c "smCancelListing" src/translations.ts

# Plan 5-3: UI Evolution
npx tsc --noEmit
npx vitest run src/components/SecondaryMarketView.test.tsx

# Full phase verification
npx tsc --noEmit
npx vitest run
cd contracts && npx hardhat test
```

---

## Success Criteria

- [ ] SecondaryMarket.sol compiles, all Hardhat tests pass (15+ test cases)
- [ ] TypeChain types generated, ABI exported to `src/abis/`
- [ ] Deploy script creates SecondaryMarket for localhost
- [ ] `SecondaryListing` type extended with optional `expirationDate`, `status`, `fee`, `totalCost`, `tokenContract`
- [ ] All new translation keys added (EN + TH)
- [ ] `useRealSecondaryMarket` rewritten with wagmi read/write hooks — same return shape as mock
- [ ] `SecondaryMarketView` shows fee %, expiration date, cancel button, total cost
- [ ] Two-step approve-then-list flow functional in create listing form
- [ ] Expired listings filtered client-side, displayed with "Expired" badge
- [ ] Cancel listing shows confirmation dialog, returns LP tokens on confirm
- [ ] All existing tests still pass
- [ ] TypeScript strict mode: 0 errors (`npx tsc --noEmit`)

---

## Output

After completion, create `.planning/05-SUMMARY.md` documenting:
- SecondaryMarket.sol contract address (from deploy-secondary-market.ts)
- ABI file location
- useRealSecondaryMarket hook interface
- Key UI changes made to SecondaryMarketView.tsx
- Test coverage numbers
- Any deployment notes or known issues
