# Concerns & Technical Debt

## Critical

### 1. No Tests
- **Risk**: High. Any refactoring or enhancement carries regression risk.
- **688 lines** in MarketplaceView.tsx has zero test coverage.

### 2. All Data Is Mock/Simulated
- Wallet balances, TVL, APY, loan applications — all hardcoded or randomly generated.
- No real blockchain, no real IoT telemetry, no real smart contracts.
- The app is essentially a **UI prototype/simulation**.

## High

### 3. All Logic in Components
- No custom hooks extracted. Business logic is inline in components.
- MarketplaceView.tsx (622 lines) mixes calculation, state, simulation, and UI.
- PortfolioView.tsx has swap/claim logic inline.

### 4. No Error Handling
- No error boundaries, no try/catch for API calls.
- `alert()` used for user-facing errors (inconsistent UX — sometimes TH, sometimes EN).
- No loading states defined (only `isPendingTx` in PortfolioView).

### 5. No API Service Layer
- Gemini AI SDK is installed but no API client/service module exists.
- If real API integration is added, there's no pattern to follow.

## Medium

### 6. Hardcoded Strings
- Some strings are in components directly (not in translations dictionary).
- Example: AdminView.tsx line 59 `("หลักทรัพย์ Available to Deploy ของระบบไม่เพียงพอโอน!")` uses `alert()` with mixed TH/EN.

### 7. No Routing Library
- Current approach (conditional render via `ViewType`) works for 4 views but won't scale.
- No URL-based navigation, no browser back/forward support.

### 8. Magic Numbers & Inline CSS
- Colors like `#0b0f19`, `#f3f6f5`, `#e2ece9` are used inline throughout JSX.
- Should be Tailwind theme tokens (already defined in index.css).

### 9. TypeScript Strictness
- `noImplicitAny`, `strictNullChecks` are not explicitly set in tsconfig.
- `strict: true` is not set — this may allow unsafe patterns.

### 10. AI Studio Dependency
- `GEMINI_API_KEY` is injected by AI Studio at runtime — hard to test locally.
- `APP_URL` is also AI Studio-managed.
