# Testing

## Status: No Testing Infrastructure

The codebase has **zero test files** and **no test framework** configured.

### Available Testing Scripts
- `npm run lint` — runs `tsc --noEmit` (TypeScript type checking only)
- No `npm test`, `npm run test`, or similar scripts exist

### Missing Testing Concerns
1. **No unit tests** for any component
2. **No integration tests** for data flow or views
3. **No E2E tests** for critical user flows (connect wallet, deposit, claim)
4. **No snapshot tests** for UI consistency

### Recommended Test Framework (if added)
Based on the Vite + React stack, recommended test frameworks:
- **Vitest** (native Vite integration, best for unit/component tests)
- **Playwright** or **Cypress** (E2E browser tests)
- **React Testing Library** (component interaction tests)

### Risk
Without tests, regressions are undetectable. Refactoring any component (especially App.tsx or MarketplaceView.tsx) carries high risk.
