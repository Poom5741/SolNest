# Project Structure

```
.
├── index.html                  # Entry HTML (title: SolaraConnect)
├── metadata.json               # AI Studio app metadata
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TS config (ES2022, bundler resolution)
├── vite.config.ts              # Vite config (React + Tailwind plugins)
├── .env.example                # Env template (GEMINI_API_KEY, APP_URL)
├── .gitignore                  # Ignores node_modules, dist, .env*
├── .agents/                    # Agent skills configuration
│   └── skills/
├── .planning/                  # Project planning directory
│   └── codebase/               # (this directory)
└── src/
    ├── main.tsx                # React entry point (StrictMode + root render)
    ├── App.tsx                 # Root component (layout, nav, state)
    ├── index.css               # Tailwind imports + design tokens + global styles
    ├── types.ts                # TypeScript types (ViewType, WalletState, etc.)
    ├── translations.ts         # EN/TH translation dictionary
    └── components/
        ├── AnimatedNumber.tsx   # Reusable animated counter with Motion
        ├── MarketplaceView.tsx  # Main landing (hero, calc, circular economy)
        ├── PortfolioView.tsx    # Investor desk (deposit, swap, claim)
        ├── HomeownerView.tsx    # Homeowner portal (tracker, inverter sim)
        └── AdminView.tsx        # Admin panel (pool stats, loan apps)
```

## Sizing
- **Total source**: 2,119 lines across 8 files
- **Largest file**: MarketplaceView.tsx (622 lines)
- **Smallest component**: AnimatedNumber.tsx (87 lines)
- **No test files** in the codebase
