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

- [ ] **SOL-01**: Define house project lifecycle — Created → Funding → Active (producing) → Repaid / Defaulted
- [ ] **SOL-02**: Per-project lending — each solar installation is its own independent lending market with its own terms (APY, duration, target amount)
- [ ] **SOL-03**: Create a project detail page for each solar installation showing project metrics, funding progress, investor list, and repayment schedule
- [ ] **SOL-04**: Implement real wallet connection (MetaMask / WalletConnect) replacing mock connection
- [ ] **SOL-05**: Smart contract integration for deposit, withdraw, claim, and repay flows per project
- [ ] **SOL-06**: Investor portfolio view showing positions across multiple projects, not pooled
- [ ] **SOL-07**: Homeowner portal with real loan tracking, repayment history, and energy production vs projection
- [ ] **SOL-08**: Secondary market — allow investors to exit early by selling their position in a project to other investors
- [ ] **SOL-09**: Admin panel for project creation, vetting status, and lifecycle management
- [ ] **SOL-10**: Real data pipeline — replace all mock/simulated data with on-chain or API-driven sources
- [ ] **SOL-11**: Replace mock wallet addresses and simulated balances with real wallet state
- [ ] **SOL-12**: Project marketplace — browse all available and active projects with filter/sort
- [ ] **SOL-13**: Risk display per project — transparent metrics (location, installer track record, energy estimates, historical performance)
- [ ] **SOL-14**: Replace `alert()` calls with proper UI notifications and error boundaries
- [ ] **SOL-15**: Extract business logic from components into custom hooks and service layers
- [ ] **SOL-16**: Establish test infrastructure (vitest + React Testing Library)
- [ ] **SOL-17**: TypeScript strict mode enabled

### Out of Scope

*Explicit boundaries. Includes reasoning to prevent re-adding.*

- **Insurance / principal protection** — SolNest does not insure projects. Transparent risk is the investor's responsibility.
- **Pooled lending** — all lending is project-specific. No general lending pools.
- **Mobile native apps** — web-only (responsive) for v1. Native apps deferred.
- **KYC/AML** — not in scope for v1. Assumes regulatory sandbox environment.

## Context

- **Current state**: UI simulation/prototype. All data is mock. No real blockchain, no real IoT, no real lending.
- **Target**: Full-stack DeFi lending platform with real wallet integration, smart contracts (EVM), per-project markets, and secondary trading.
- **Tech stack**: React 19 + TypeScript 5.8 + Tailwind v4 + Vite 6 + Google Gemini AI SDK (existing). Need to add: ethers/viem, hardhat/foundry, test framework.
- **Platform**: Currently deployed via Google AI Studio (Cloud Run with server-side Gemini capability). Future deployment TBD.
- **Project lifecycle model**: Each project is a solar installation. Lifecycle: Created → Funding → Active (producing electricity, generating revenue) → Repaid (investors recoup + yield) / Defaulted (shortfall).

## Constraints

- **Tech Stack**: Must build on existing React 19 + TypeScript + Tailwind v4 + Vite stack. Add new dependencies rather than replace.
- **Browser**: Web-only. Responsive design required.
- **Smart Contracts**: EVM-compatible (Ethereum L2 / Polygon preferred) for v1.
- **AI Studio**: Current deployment on AI Studio Cloud Run — Gemini API capability available server-side.
- **No test infrastructure yet** — must establish from scratch.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Per-project lending (no pools) | Each solar installation has unique risk profile, location, installer — pooling obscures risk | ✓ Good |
| Full-service project sourcing | SolNest vets projects end-to-end rather than being a pure marketplace | ✓ Good |
| No insurance | Transparent risk aligns incentives; insurance creates moral hazard | ✓ Good |
| Open-ended lending + secondary market | Investors aren't locked until maturity — liquidity via secondary trading | — Pending |
| Smart contracts on EVM L2 | Lower gas costs for many small per-project markets | — Pending |
| Existing mock → real data incrementally | Replace one module at a time rather than big-bang rewrite | — Pending |

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
*Last updated: 2026-05-22 after project initialization*
