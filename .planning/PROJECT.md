# SolNest

## What This Is

SolNest is a decentralized solar finance platform bridging Real-World Assets (RWA) with DeFi lending. Each solar installation project becomes its own lending market — investors fund individual household solar systems, homeowners repay from energy savings, and investors earn yield. SolNest is full-service: it sources, vets, and manages solar projects. No pooled lending — each project stands on its own risk profile.

## Core Value

Trustworthy per-project solar lending with transparent risk — no pooling, no insurance, just clear individual project economics that let investors make informed decisions.

## Requirements

### Validated

*Shipped and confirmed valuable.*

- ✓ **4-view UI** (Marketplace, Portfolio, Homeowner, Admin) — existing
- ✓ **EN/TH bilingual translations** — existing
- ✓ **Mock wallet connection UI** — existing
- ✓ **Animated metrics display** (TVL, APY, counters) — existing
- ✓ **Responsive layout with mobile hamburger menu** — existing
- ✓ **Tailwind v4 theme system** (`@theme` directives) — existing
- ✓ **Express server configured** — existing
- ✓ **Gemini AI SDK** (`@google/genai`) wired — existing

### Active

*Current scope. Building toward these.*

- [ ] **SOL-01**: Mock everything — build complete stakeholder demo with simulated data, deployed to Cloudflare Pages
- [ ] **SOL-02**: Per-project lending smart contracts — deployed to testnet
- [ ] **SOL-03**: Replace mock data with real on-chain data and wallet integration
- [ ] **SOL-04**: Cloudflare Workers + D1 backend for off-chain services
- [ ] **SOL-05**: Secondary market for LP token trading

### Out of Scope

- Insurance fund / pooled risk — transparent per-project risk is intentional
- Fiat on-ramp — crypto-native MVP only

## Context

SolNest is being developed by a solo founder. The existing codebase (originally named "SolaraConnect") is a Vite + React 19 + TypeScript 5.8 + Tailwind v4 SPA with 4 views and Gemini AI SDK integration. All data is currently mocked. No tests, no real wallet integration, no blockchain connection.

The build strategy is mock-first: show stakeholders a fully functional demo on Cloudflare Pages, then build and integrate real smart contracts and on-chain data.

## Constraints

- **Tech stack**: React 19 + TypeScript + Tailwind v4 (frontend), Cloudflare Pages (hosting), Cloudflare Workers (backend API), Solidity + Hardhat (smart contracts), Sepolia testnet (deploy target)
- **Timeline**: Solo founder — phases should produce shippable increments
- **Budget**: Minimize paid services — Cloudflare free tier, testnet gas
- **Dependencies**: Phase 1 must be fully standalone (no blockchain dependency)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mock-first approach | Show stakeholder demo before building smart contracts | ✓ Good |
| Cloudflare Pages + Workers | Free tier, global CDN, Workers for backend logic | ✓ Good |
| Per-project lending (not pooled) | Each solar installation is its own market with unique risk | ✓ Good |
| No insurance | Transparent risk is investor's responsibility | ✓ Good |
| Open-ended lending with early exit | Secondary market provides liquidity, no fixed lockup | ✓ Good |
| Sepolia testnet | Standard Ethereum testnet, ample faucets, well-supported | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 — Cloudflare platform, mock-first strategy*
