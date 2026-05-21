# Requirements: SolNest

**Defined:** 2026-05-22
**Core Value:** Trustworthy per-project solar lending with transparent risk

## v1 Requirements

### Codebase Foundation

- [ ] **TCH-01**: Enable TypeScript strict mode (`strict: true` in tsconfig)
- [ ] **TCH-02**: Establish test infrastructure (Vitest + React Testing Library)
- [ ] **TCH-03**: Extract business logic from components into custom hooks and service layers
- [ ] **TCH-04**: Replace `alert()` calls with proper UI notification system and error boundaries
- [ ] **TCH-05**: Restructure hardcoded strings into translations dictionary

### Smart Contracts

- [ ] **SC-01**: ProjectMarketFactory contract — deploys and tracks per-project lending markets
- [ ] **SC-02**: ProjectMarket contract — handles deposit, withdraw, repay, claim per project
- [ ] **SC-03**: Project lifecycle management — Created → Funding → Active → Repaid / Defaulted
- [ ] **SC-04**: LP token (ERC-20) representing investor position in each project
- [ ] **SC-05**: SolNest admin role for project creation and lifecycle transitions
- [ ] **SC-06**: Hardhat development environment with tests

### Frontend — Wallet & Web3 Integration

- [ ] **WAL-01**: Real wallet connection via wagmi + viem (MetaMask, WalletConnect)
- [ ] **WAL-02**: Real balance display and transaction signing instead of mock
- [ ] **WAL-03**: Chain/network switching support

### Frontend — Project Marketplace

- [ ] **MKT-01**: Browse all available and active solar projects
- [ ] **MKT-02**: Project detail page with metrics (target, APY, duration, funding progress)
- [ ] **MKT-03**: Filter and sort projects by risk profile, location, APY, funding status

### Frontend — Per-Project Lending

- [ ] **LND-01**: Deposit into individual project market
- [ ] **LND-02**: Withdraw from project market (during funding phase)
- [ ] **LND-03**: View investor position in each project (LP token balance, value)
- [ ] **LND-04**: Claim repaid principal + interest

### Frontend — Homeowner Portal

- [ ] **HOM-01**: View loan terms and repayment schedule
- [ ] **HOM-02**: Make repayments
- [ ] **HOM-03**: Energy production tracking vs projections
- [ ] **HOM-04**: Inverter telemetry dashboard

### Frontend — Admin Panel

- [ ] **ADM-01**: Create new solar project (set target, APY, duration, location)
- [ ] **ADM-02**: Manage project lifecycle transitions
- [ ] **ADM-03**: View all project metrics and investor positions
- [ ] **ADM-04**: Upload/manage project documentation and installer details

### Frontend — Secondary Market

- [ ] **SEC-01**: List LP tokens for sale
- [ ] **SEC-02**: Buy LP tokens from other investors
- [ ] **SEC-03**: View order book / offers per project

### Risk & Transparency

- [ ] **RSK-01**: Display per-project risk metrics (location, installer track record, energy estimates)
- [ ] **RSK-02**: Transparent loan terms and historical performance data

## v2 Requirements

- **[V2-01]**: Insurance / protection pools (if demand materializes)
- **[V2-02]**: Mobile native apps
- **[V2-03]**: KYC/AML integration
- **[V2-04]**: Multi-chain support (Solana, etc.)
- **[V2-05]**: Automated market making for secondary LP tokens
- **[V2-06]**: Real IoT telemetry integration (Siwasolar inverters)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Insurance / principal protection | Not offered — transparent risk is investor's responsibility |
| Pooled lending | All lending is per-project, no general lending pools |
| Mobile native apps | Web-only for v1 |
| KYC/AML | Defers to regulatory sandbox context |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TCH-01 | Phase 1 | Pending |
| TCH-02 | Phase 1 | Pending |
| TCH-03 | Phase 1 | Pending |
| TCH-04 | Phase 1 | Pending |
| TCH-05 | Phase 1 | Pending |
| SC-01 | Phase 2 | Pending |
| SC-02 | Phase 2 | Pending |
| SC-03 | Phase 2 | Pending |
| SC-04 | Phase 2 | Pending |
| SC-05 | Phase 2 | Pending |
| SC-06 | Phase 2 | Pending |
| WAL-01 | Phase 3 | Pending |
| WAL-02 | Phase 3 | Pending |
| WAL-03 | Phase 3 | Pending |
| MKT-01 | Phase 3 | Pending |
| MKT-02 | Phase 3 | Pending |
| MKT-03 | Phase 3 | Pending |
| LND-01 | Phase 4 | Pending |
| LND-02 | Phase 4 | Pending |
| LND-03 | Phase 4 | Pending |
| LND-04 | Phase 4 | Pending |
| HOM-01 | Phase 5 | Pending |
| HOM-02 | Phase 5 | Pending |
| HOM-03 | Phase 5 | Pending |
| HOM-04 | Phase 5 | Pending |
| ADM-01 | Phase 5 | Pending |
| ADM-02 | Phase 5 | Pending |
| ADM-03 | Phase 5 | Pending |
| ADM-04 | Phase 5 | Pending |
| SEC-01 | Phase 6 | Pending |
| SEC-02 | Phase 6 | Pending |
| SEC-03 | Phase 6 | Pending |
| RSK-01 | Phase 4 | Pending |
| RSK-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after project initialization*
