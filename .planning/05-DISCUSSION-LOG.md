# Phase 5 DISCUSSION LOG

**Date:** 2026-05-22
**Mode:** Default (interactive, no flags)
**Areas discussed:** 4

---

## Area 1: Order Book Architecture

**Q1: Core mechanism — how listings and purchases work?**
- Options: Simple P2P offers, Full order book, Auction-based
- Selected: **Simple P2P offer system** — sellers list tokens at fixed price, buyers accept directly. No bid/ask matching for v1.

**Q2: Partial vs whole-position sales?**
- Options: Partial, Whole
- Selected: **Partial sales allowed** — seller can list any USDC amount of their LP position.

**Q3: Fixed price vs negotiation vs auction?**
- Options: Fixed price (seller sets), Negotiation, Auction
- Selected: **Fixed price, seller sets** — no negotiation/haggling.

**Q4: Expiration and cancellation?**
- Options: No expiration (manual cancel only), Expire after N days, Cancel anytime
- Selected: **Listings expire after N days** (seller sets duration). Auto-cancel on expiry and return escrowed tokens. Sellers can also cancel anytime before expiration.

---

## Area 2: Token Custody During Listing

**Q1: Where do LP tokens live while listed?**
- Options: Escrow (contract custody), Seller wallet, Allowance
- Selected: **Escrow** — LP tokens transferred to secondary market contract when listed. Trustless, prevents double-spend.

**Q2: Yield during listing — who earns it?**
- Options: Seller, Buyer, Split
- Selected: **Buyer receives yield from purchase date**. Seller earned pre-listing yield via existing ProjectMarket accounting.

**Q3: Can sellers cancel and get tokens back?**
- Options: Yes (anytime), Only before purchase, No
- Selected: **Yes, cancel anytime** before expiration and get tokens back.

**Q4: Fee model?**
- Options: No fee for v1 (recommended), Small fee (1-2%)
- Selected: **Small protocol fee (1-2%)** — user chose fee over no-fee recommendation.

---

## Area 3: Pricing Model

**Q1: Token to price — USDC or multi-token?**
- Options: USDC only, Multi-token
- Selected: **USDC only** — matches existing ProjectMarket currency.

**Q2: Price constraints?**
- Options: Unconstrained (any price), Face value ±N%(floor/ceiling), Free market
- Selected: **Unconstrained** — seller sets any price. UI shows face value as soft reference.

**Q3: Per-unit or total pricing?**
- Options: Total USDC for listed amount, Per-unit price, Per-share price
- Selected: **Total USDC cost** for the listed amount — one price, one transaction.

**Q4: Who pays the fee?**
- Options: Seller, Buyer, Split
- Selected: **Fee added on top to buyer** — seller receives full list price, buyer pays list + fee.

---

## Area 4: Existing UI — Evolve or Rebuild

**Q1: Keep existing SecondaryMarketView or rebuild?**
- Options: Evolve in-place, Rebuild from scratch, New component
- Selected: **Evolve in-place** — keep SecondaryMarketView.tsx, refactor props for wagmi hooks.

**Q2: Component architecture?**
- Options: Presentational (props-in/events-out), Smart (hooks inside), Hybrid
- Selected: **Stay presentational** — props-in/events-out, wagmi hooks in useRealSecondaryMarket. Matches existing Phase 3 view pattern.

**Q3: Extend or replace SecondaryListing type?**
- Options: Extend existing, New type
- Selected: **Extend existing** with optional new fields (expirationDate, status, fee). Backward compatible with mock data.

**Q4: Test strategy?**
- Options: Keep only existing, Extend existing with contract tests, New test suite
- Selected: **Keep existing tests + extend** with contract-integration tests for escrow and purchase flows.
