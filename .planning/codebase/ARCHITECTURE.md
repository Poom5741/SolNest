# Architecture

## High-Level Pattern
Single-Page Application (SPA) with React 19. No routing library — uses `useState<ViewType>` for view switching.

## Component Tree
```
main.tsx
└── App.tsx (root + layout + navigation)
    ├── MarketplaceView.tsx (hero, calculator, circular economy, terminal)
    ├── PortfolioView.tsx (deposit, swap, claim, terminal log)
    ├── HomeownerView.tsx (tracker, inverter simulator, savings calc)
    └── AdminView.tsx (pool stats, loan apps, telemetry, capital mgmt)
```

## State Management
- **No global state library** (no Redux, Zustand, Context API)
- State lives in individual components via `useState`
- `WalletState` is lifted to App.tsx and passed as props to child views
- Language preference persisted to `localStorage`

## Data Flow
```
App.tsx (owner of: lang, currentView, walletState)
  ├── passes lang+walletState as props ↓
  ├── passes setView as callback → child views handle navigation
  └── encapsulates wallet connect/disconnect logic
```

## Navigation
- Custom `ViewType` union type: `"marketplace" | "portfolio" | "homeowner" | "admin"`
- Conditional rendering in App.tsx — no React Router
- Mobile hamburger menu toggles sidebar overlay

## Key Design Decisions
1. **No routing library** — keeps dependencies minimal for AI Studio deployment
2. **Mock data** — all financial data (TVL, APY, balances) is simulated for demo/sandbox
3. **Thai language support** — bilingual EN/TH via translation dictionary
4. **Tailwind v4** — uses new `@theme` directive for design tokens; no CSS modules
