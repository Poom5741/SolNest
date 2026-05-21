# Requirements: SolNest

**Defined:** 2026-05-22
**Core Value:** Trustworthy per-project solar lending with transparent risk

## v1 Requirements

### Cloudflare Infrastructure

- [ ] **CLO-01**: Frontend deployed to Cloudflare Pages for stakeholder preview
- [ ] **CLO-02**: Cloudflare Workers for off-chain API services
- [ ] **CLO-03**: Cloudflare D1 for off-chain data storage
- [ ] **CLO-04**: Cloudflare R2 for document/image storage

### Codebase Foundation

- [ ] **TCH-01**: Enable TypeScript strict mode (`strict: true` in tsconfig)
- [ ] **TCH-02**: Establish test infrastructure (Vitest + React Testing Library)
- [ ] **TCH-03**: Extract business logic from components into custom hooks and service layers
- [ ] **TCH-04**: Replace `alert()` calls with proper UI notification system and error boundaries
- [ ] **TCH-05**: Restructure hardcoded strings into translations dictionary

### Stakeholder Demo — All Mock Data

- [ ] **DEM-01**: Complete mock service layer — easy to swap for real data (hook-based)
- [ ] **DEM-02**: Marketplace — browse projects, filter/sort, project detail page (target, APY, duration, funding, risk)
- [ ] **DEM-03**: Lending flows — mock deposit, withdraw, claim per project
- [ ] **DEM-04**: Portfolio — investor positions across all projects
- [ ] **DEM-05**: Homeowner portal — loan dashboard, mock repayment, energy tracker, inverter telemetry
- [ ] **DEM-06**: Admin panel — project creation form, lifecycle management (Created → Funding → Active → Repaid/Defaulted)
- [ ] **DEM-07**: Secondary market — list and buy LP positions
- [ ] **DEM-08**: Live demo deployed to Cloudflare Pages for stakeholder walkthrough

### Smart Contracts

- [ ] **SC-01**: ProjectMarketFactory contract — deploys and tracks per-project lending markets
- [ ] **SC-02**: ProjectMarket contract — handles deposit, withdraw, repay, claim per project
- [ ] **SC-03**: Project lifecycle management — Created → Funding → Active → Repaid / Defaulted
- [ ] **SC-04**: LP token (ERC-20) representing investor position in each project
- [ ] **SC-05**: SolNest admin role for project creation and lifecycle transitions
- [ ] **SC-06**: Hardhat development environment with tests
- [ ] **SC-07**: Contracts deployed to testnet (Sepolia)

### Frontend — Wallet & Web3 Integration (Real)

- [ ] **WAL-01**: Real wallet connection via wagmi + viem (MetaMask, WalletConnect)
- [ ] **WAL-02**: Real balance display and transaction signing
- [ ] **WAL-03**: Chain/network switching support

### Frontend — Project Marketplace (Real)

- [ ] **MKT-01**: Browse all available and active solar projects from contract data
- [ ] **MKT-02**: Project detail page with real metrics
- [ ] **MKT-03**: Filter and sort by risk profile, location, APY, funding status

### Frontend — Per-Project Lending (Real)

- [ ] **LND-01**: Deposit into individual project market via contract
- [ ] **LND-02**: Withdraw from project market (during funding phase)
- [ ] **LND-03**: View investor LP token positions
- [ ] **LND-04**: Claim repaid principal + interest

### Frontend — Homeowner Portal (Real)

- [ ] **HOM-01**: View loan terms and repayment schedule from contract
- [ ] **HOM-02**: Make repayments via contract
- [ ] **HOM-03**: Energy production tracking vs projections
- [ ] **HOM-04**: Inverter telemetry dashboard

### Frontend — Admin Panel (Real)

- [ ] **ADM-01**: Create new solar project via contract
- [ ] **ADM-02**: Manage project lifecycle transitions
- [ ] **ADM-03**: View all project metrics and investor positions
- [ ] **ADM-04**: Upload/manage project documentation

### Frontend — Secondary Market

- [ ] **SEC-01**: List LP tokens for sale
- [ ] **SEC-02**: Buy LP tokens from other investors
- [ ] **SEC-03**: Order book / active offers per project

### Risk

- [ ] **RSK-01**: Transparent risk metrics per project (location, installer track record, energy estimates)
- [ ] **RSK-02**: No insurance — investor acknowledges individual project risk

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

- **V2-01**: Multi-chain support (Polygon, Base)
- **V2-02**: Automated market maker for secondary market
- **V2-03**: Real IoT device integration for live telemetry
- **V2-04**: Mobile native app

## Out of Scope

| Feature | Reason |
|---------|--------|
| Insurance fund / pooled risk | User explicitly rejected — transparent per-project risk is the model |
| Fiat on-ramp | Out of scope for crypto-native MVP |
| Credit scoring / underwriting | Project vetting is SolNest's manual process per design doc |
| Yield optimization / auto-compounding | Per-project fixed terms, no compounding |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLO-01 | Phase 1 | Pending |
| TCH-01-05 | Phase 1 | Pending |
| DEM-01-08 | Phase 1 | Pending |
| SC-01-07 | Phase 2 | Pending |
| WAL-01-03 | Phase 3 | Pending |
| MKT-01-03 | Phase 3 | Pending |
| LND-01-04 | Phase 3 | Pending |
| HOM-01-04 | Phase 3 | Pending |
| ADM-01-04 | Phase 3 | Pending |
| CLO-02-04 | Phase 4 | Pending |
| SEC-01-03 | Phase 5 | Pending |
| RSK-01-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---
*Requirements updated: 2026-05-22 — restructured for mock-first workflow, Cloudflare platform*
