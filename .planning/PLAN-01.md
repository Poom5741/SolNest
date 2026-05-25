# PLAN-01: Mock Everything + Stakeholder Demo

**Phase:** 1 | **Milestone:** v1.0 | **Created:** 2026-05-22
**Goal:** Verify, harden, and deploy the existing mock demo to Cloudflare Pages.

---

## Pre-Existing Work

Phase 1 implementation is ~80% complete. The following exist:

| Requirement | Status | Evidence |
|---|---|---|
| TCH-01 (strict mode) | DONE | `tsc --noEmit` = 0 errors |
| TCH-02 (test infra) | DONE | Vitest + RTL + jsdom, 2 tests pass |
| TCH-04 (no alert()) | DONE | 0 alert() calls found |
| TCH-05 (translations) | DONE | EN+TH dictionary complete |
| DEM-01 (mock layer) | EXISTS | 7 hooks + mockData.ts |
| DEM-02-07 (views) | EXISTS | 5 view components built |
| DEM-08 (live demo) | PENDING | Build works, deploy needed |
| TCH-03 (logic extract) | VERIFY | Views ~1300 lines, need audit |

---

## Tasks

### Task 1: Visual Verification
**Priority:** HIGH | **Depends on:** None

Launch dev server. Verify every view renders, interactions work, no errors.

- [ ] Launch dev server, test Marketplace view (filter, sort, detail)
- [ ] Test Portfolio view (positions, summary)
- [ ] Test Homeowner view (loan dashboard, repayment, energy tracker)
- [ ] Test Admin view (project creation, lifecycle transitions)
- [ ] Test Secondary Market view (listings, buy flow)
- [ ] Test Wallet modal (connect/disconnect)
- [ ] Test Language toggle EN/TH across all views
- [ ] Test Toast notifications on actions
- [ ] Log all bugs, broken interactions, missing translations

**Verification:** All views render without errors.

---

### Task 2: Service Hook Tests
**Priority:** HIGH | **Depends on:** None

Write unit tests for all 7 mock service hooks.

- [ ] useMockProjects.test.ts
- [ ] useMockLending.test.ts
- [ ] useMockPortfolio.test.ts
- [ ] useMockHomeowner.test.ts
- [ ] useMockAdmin.test.ts
- [ ] useMockSecondaryMarket.test.ts
- [ ] useMockWallet.test.ts

**Verification:** 7 new test files passing.

---

### Task 3: View Component Tests
**Priority:** MEDIUM | **Depends on:** Task 2

Write component smoke tests for all views.

- [ ] MarketplaceView.test.tsx
- [ ] PortfolioView.test.tsx
- [ ] HomeownerView.test.tsx
- [ ] AdminView.test.tsx
- [ ] SecondaryMarketView.test.tsx
- [ ] Toast.test.tsx
- [ ] ErrorBoundary.test.tsx
- [ ] AnimatedNumber.test.tsx

**Verification:** 8 new view test files passing.

---

### Task 4: TCH-03 Audit
**Priority:** MEDIUM | **Depends on:** None

Audit views for inline business logic that should be extracted to hooks.

- [ ] Review MarketplaceView.tsx for inline filtering/sorting
- [ ] Review AdminView.tsx for inline validation/lifecycle logic
- [ ] Review remaining views for extractable logic
- [ ] Extract logic into src/hooks/ if found

**Verification:** tsc --noEmit = 0 errors. Views cleaner where applicable.

---

### Task 5: Cloudflare Pages Deploy
**Priority:** HIGH | **Depends on:** Task 1

Deploy to Cloudflare Pages for stakeholder demo.

- [ ] Verify wrangler.toml config
- [ ] Run npm run build, verify dist/
- [ ] Run npx wrangler pages deploy dist/
- [ ] Verify deployed URL loads all views
- [ ] Document URL

**Verification:** CLO-01 satisfied. Deployed and functional.

---

### Task 6: Final Polish
**Priority:** LOW | **Depends on:** Tasks 1-5

Final quality gate.

- [ ] Full test suite passes
- [ ] tsc --noEmit = 0 errors
- [ ] npm run build succeeds
- [ ] Verify all translations have EN+TH entries
- [ ] Verify no console errors on any view
- [ ] Verify loading/error/empty states
- [ ] Verify responsive layout

**Verification:** All checks green.

---

## Execution Order

```
Task 1 (Visual Verify) --+
Task 2 (Service Tests) --+-- Task 3 (View Tests) --+
Task 4 (TCH-03 Audit) ---+                          +-- Task 6 (Polish)
Task 5 (Deploy) ------------------------------------+
```

**Parallel:** Tasks 1, 2, 4, 5. Task 3 depends on Task 2.

---

## Success Criteria

- [ ] All 5 views render without errors
- [ ] 15+ test files passing (2 existing + 7 service + 8 view)
- [ ] Zero TypeScript errors
- [ ] Deployed to Cloudflare Pages with functional URL
- [ ] Business logic extracted from views where applicable
- [ ] All user-facing strings in translations (EN + TH)
