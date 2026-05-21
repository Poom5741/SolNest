# Conventions & Patterns

## Code Style
- **Functional components** with explicit React imports (`import React, { useState } from "react"`)
- **Named exports** (default exports for components)
- **Interface over type** for props (e.g., `interface MarketplaceViewProps`)
- **Lucide React** for all icons (snake_case imports)
- **Tailwind CSS** for all styling — no CSS modules or styled-components
- **Tailwind v4** `@theme` directive for custom design tokens (colors, shadows, fonts)

## Component Pattern
```tsx
interface ComponentProps {
  // props definition
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // State hooks at top
  // Derived values next
  // Handlers next
  return (/* JSX */);
}
```

## Naming
- **Files**: PascalCase for components (`MarketplaceView.tsx`), camelCase for utilities (`translations.ts`, `types.ts`)
- **Functions**: camelCase (`handleConnectWallet`, `handleDepositSubmit`)
- **Types/Interfaces**: PascalCase (`WalletState`, `LoanApplication`, `ViewType`)
- **CSS classes**: Utility classes only (Tailwind) — no custom CSS class names

## State Management
- `useState` for local component state
- State lifting (to App.tsx) for shared state (wallet, language, currentView)
- `localStorage` for language preference persistence
- No Context API, Redux, or external state library

## Localization
- `Language` type: `"en" | "th"`
- `translations` dictionary as nested objects per language
- Lookup: `translations[lang].keyName`

## Animation
- **Motion library** (`motion/react`) used in `AnimatedNumber` component
- CSS `animate-pulse-slow` custom utility for slow pulsing
- CSS transitions for hover/active states

## No Testing Conventions
- No test framework installed
- No test files found
- No testing patterns established
