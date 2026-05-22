# Phase 5: Secondary Market - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

## Phase Boundary

This phase delivers a P2P secondary market where investors can list their LP tokens for sale and buy LP tokens from other investors. The boundary is:
- **In scope:** On-chain escrow contract for LP token custody during listing, simple offer listing (fixed price, seller-set), buyer acceptance, expiration mechanism, protocol fee, UI to view/buy/create listings per project
- **Out of scope:** Automated market maker (AMM), bid/ask matching, negotiation, multi-token pricing, yield auto-compounding, fiat on-ramp

## Implementation Decisions

### Order Book Architecture
- **D-01:** Simple P2P offer system — sellers list tokens at a fixed price, buyers accept/purchase directly. No bid/ask order matching for v1.
- **D-02:** Partial sales allowed — seller can list any USDC amount of their LP position (not required to sell entire position).
- **D-03:** Fixed price, seller sets — no negotiation or haggling. Seller determines the total USDC price for the listed amount.
- **D-04:** Listings expire after N days (seller sets duration). Auto-cancel on expiry and return escrowed tokens to seller.

### Token Custody During Listing
- **D-05:** Escrow model — LP tokens are transferred to the secondary market contract when listed. Prevents double-spend; ensures buyer receives tokens on purchase.
- **D-06:** Buyer receives yield accrual from purchase date. Seller earned yield pre-listing via existing ProjectMarket accounting (LP tokens represent continuous ownership).
- **D-07:** Sellers can cancel an active listing at any time before expiration. Escrowed tokens returned to seller.
- **D-08:** Protocol fee of 1-2% on each completed secondary trade. Fee is added on top of the listing price — buyer pays list price + fee, seller receives full list price.

### Pricing Model
- **D-09:** USDC only — matches the existing ProjectMarket currency (no multi-token pricing).
- **D-10:** Unconstrained pricing — seller sets any price. UI shows face value as soft reference guidance. No floor or ceiling.
- **D-11:** Total USDC cost for the listed amount — one price, one transaction. Not a per-unit price.
- **D-12:** Fee collected from buyer (added to list price). Seller receives the full listed amount.

### Existing UI — Evolve
- **D-13:** Evolve `SecondaryMarketView.tsx` in-place — refactor props to work with wagmi hooks, not rebuild from scratch.
- **D-14:** Component stays presentational (props-in, events-out pattern). Real data flows through `useRealSecondaryMarket` hook, matching existing view architecture from Phase 3.
- **D-15:** Extend `SecondaryListing` interface with optional new fields (`expirationDate`, `status`, `fee`) — backward compatible with existing mock data.
- **D-16:** Keep existing tests and extend with contract-integration tests for the new escrow and purchase flows.

### Agent Discretion
- No areas were deferred to agent discretion — all gray areas had explicit user decisions.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 5 — Phase boundary, dependency (Phase 3), requirements SEC-01/02/03
- `.planning/REQUIREMENTS.md` — SEC-01 (List LP tokens for sale), SEC-02 (Buy LP tokens from other investors), SEC-03 (Order book / active offers per project)

### Architecture & Patterns
- `.planning/CONTEXT-03.md` — Phase 3 architecture: Web3Provider → hook → view pattern, wagmi/viem hook conventions, mock→real hook mapping (useMockSecondaryMarket → useRealSecondaryMarket), view as presentational component pattern
- `src/AGENTS.md` — Component patterns (functional components, props-in/events-out, hooks for state, no client-side router)

### Existing Contracts
- `contracts/contracts/ProjectMarket.sol` — Existing ERC20 LP token contract pattern (ERC20, AccessControl, ReentrancyGuard, SafeERC20). Secondary market contract must be compatible — LP tokens are ERC20.
- `contracts/contracts/interfaces/IProjectMarket.sol` — Interface pattern for new ISecondaryMarket.sol

### Existing Frontend Assets
- `src/components/SecondaryMarketView.tsx` — Current UI (listings grid, buy button, create listing form). To be evolved per D-13/D-14.
- `src/services/real/useRealSecondaryMarket.ts` — Current real hook (stub with mock data). To be upgraded with wagmi write/read for escrow + purchase.
- `src/services/mock/useMockSecondaryMarket.ts` — Mock hook (for reference on expected interface shape).
- `src/types.ts` — `SecondaryListing` interface (id, projectId, projectName, amount, price, seller, createdAt). To be extended per D-15.
- `src/App.tsx` — View routing via ViewType enum, wallet state propagation, hook selection (mock vs real).

## Existing Code Insights

### Reusable Assets
- **`SecondaryMarketView.tsx`**: Full working UI component with listings grid, buy flow, create listing modal. Keep and refactor props.
- **`useRealSecondaryMarket` hook**: Already wired into App.tsx with wallet address. Upgrade from stub to full contract interaction.
- **`useFormatCurrency` hook**: Exists for USDC price formatting — reuse for listing prices and fees.
- **`useToast`**: Exists for transaction feedback — reuse for buy/list/cancel confirmations.
- **Mock data patterns**: `SecondaryListing[]` mock data in both mock and real hooks — replace with contract reads.

### Established Patterns
- **Hook interface consistency**: Real hooks must export same interface shape as mocks (`{ data, isLoading, error, mutate, ...actions }`). See CONTEXT-03.md hook mapping table.
- **View as presentational**: `SecondaryMarketView` receives data + callbacks as props. Hooks own the state and contract interaction. Pattern used across all Phase 3 views.
- **Wallet state passes through App.tsx**: `walletAddress: string` passed to hooks. `isConnected` gates views.
- **Wagmi/viem primitives**: `useReadContract` for reading listings, `useWriteContract` + `useWaitForTransactionReceipt` for purchases/creates/cancels. `useAccount` for wallet state.
- **Contract deployment pattern**: Hardhat localhost → Sepolia testnet. Contract addresses tracked in `.planning/contract-addresses.md`.

### Integration Points
- **New Solidity contract**: `SecondaryMarket.sol` — escrow for LP tokens, listing CRUD, purchase flow, fee collection, expiration. Must integrate with `ProjectMarket.sol` (approve/transferFrom LP tokens).
- **Frontend hook upgrade**: `useRealSecondaryMarket` needs `useWriteContract` calls to new secondary market contract + `useReadContract` for listing queries.
- **App.tsx wiring**: Already wired — `useRealSecondaryMarket(walletAddress)` called and passed to `<SecondaryMarketView>`. No App.tsx structural changes needed.
- **Type extension**: Add optional fields to `SecondaryListing` interface. Update mock data to include new fields.
- **Testing**: Existing `SecondaryMarketView.test.tsx` and `useMockSecondaryMarket.test.ts` — keep and extend.

## Specific Ideas

No specific requests — follow the decisions above and standard wagmi/viem contract integration patterns from Phase 3.

## Deferred Ideas

- **V2-02: Automated Market Maker (AMM)** — Deferred to v2. v1 uses simple P2P offers per D-01.
- **Bid/ask order matching** — Explicitly excluded for v1 per D-01. Could pair with AMM in v2.
- **Multi-token pricing** — Explicitly excluded for v1 per D-09 (USDC only).

---

*Phase: 5-Secondary Market*
*Context gathered: 2026-05-22*
