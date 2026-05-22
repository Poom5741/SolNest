# src/ — Frontend Agent Instructions

> Inherits from root `AGENTS.md`. Root conventions (TDG, TypeScript strict, commits) apply here.

## Architecture

**App shell** (`App.tsx`): view-based routing via `ViewType` enum — switches between `MarketplaceView`, `PortfolioView`, `HomeownerView`, `AdminView`, `SecondaryMarketView`. Language/locale persisted in `localStorage`. Wallet connection handled via modal + custom mock hooks.

**No client-side router** (React Router) — views are conditionally rendered by `ViewType` state.

---

## Component Patterns

### Functional Components (Default)
All components are functional React components. Use hooks for state and side effects.

```tsx
// Standard pattern — imports, hooks at top, JSX return
import { useState } from 'react';
import { motion } from 'motion';

export function MyComponent({ data }: { data: MyType }) { ... }
```

### Error Boundary (Exception)
`ErrorBoundary.tsx` is a **class component** — intentional. React error boundaries require `componentDidCatch`. This is the ONLY class component allowed. All normal UI work stays functional.

---

## Context API Pattern

`Toast.tsx` establishes the canonical Context pattern:

```tsx
// 1. Create context (file-level)
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 2. Provider wraps children with state management
export function ToastProvider({ children }: { children: React.ReactNode }) { ... }

// 3. Custom hook for consuming
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be within ToastProvider');
  return ctx;
}
```

**When to use Context**: shared state consumed by 3+ components at different tree levels. For local state, use `useState` in the nearest common ancestor.

---

## Mock Service Hooks

All mock hooks in `src/services/mock/` follow an identical interface pattern:

```ts
interface UseMockReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;        // refetch / optimistic refresh
  // ... domain-specific actions
}
```

Each hook returns `{ data, isLoading, error, mutate, ...actions }`. Network delay simulated via `setTimeout` in `useCallback`.

**When creating a new mock hook**:
- Export as default: `export default function useMockX()`
- Follow the `{ data, isLoading, error, mutate }` return shape exactly
- Wrap async work in `useCallback`
- Set `isLoading: true` before simulated delay, `false` after

---

## Styling — Tailwind CSS v4

**Design tokens** defined in `src/index.css` via the `@theme` directive:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#0a1628` (dark navy) | Backgrounds, cards |
| `--color-secondary` | `#14b886` (emerald) | CTAs, highlights |
| `--color-accent` | `#f59e0b` (amber) | Warnings, accents |
| `--font-primary` | Inter | Body text |
| `--font-mono` | JetBrains Mono | Code, data |
| `--shadow-solar` | Navy-tinted glow | Cards |
| `--shadow-glow` | Emerald-tinted glow | CTAs, active states |
| `--animate-pulse-slow` | 3s pulse | Loading states |

**Conventions**:
- Use Tailwind utility classes. No CSS modules, no `styled-components`.
- Arbitrary values for one-off colors: `bg-[#0f172a]`, `border-white/10`
- Custom `z-index` values for modals/toasts: `z-[100]`, `z-[200]`
- Keep custom CSS in `index.css` — `@theme` block for tokens, scrollbars, base resets
- Do NOT add new `.css` files; use Tailwind utilities or extend `@theme`

---

## Animation — motion (Framer Motion)

```tsx
import { motion, AnimatePresence } from 'motion';

// Enter/exit animations on conditional renders
<AnimatePresence>
  {toast && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```

- Use `AnimatePresence` for any conditional render that needs enter/exit transitions
- Spring animations preferred over tween for natural motion
- `layout` prop on `motion.div` for auto-animating layout shifts
- `AnimatedNumber.tsx` handles counter animations — reference when building new numeric displays

---

## Internationalization (i18n)

`src/translations.ts` — flat key-value object, no library dependency.

```ts
// Structure: { [lang]: { [key]: string } }
export const translations = {
  en: { home: 'Home', ... },
  th: { home: 'หน้าแรก', ... },
};
```

- `Language` enum in `src/types.ts`
- Current language stored in `localStorage` (App.tsx)
- All user-facing strings must go through `translations`
- Add new keys to both `en` and `th` simultaneously

---

## Type Organization

`src/types.ts` — **all shared types live here**. Do not scatter interfaces across component files.

**Domains**:
- `ViewType`, `Language`, `ProjectStatus`, `RiskLevel` — Enums
- `Project`, `LendingPosition`, `PortfolioSummary` — Domain models
- `WalletState`, `ToastMessage`, `AdminProjectForm` — UI state
- `EnergyTelemetry`, `InverterData` — IoT data

**When to add a new type**:
1. Used by 2+ files → add to `types.ts`
2. Used by single component → co-locate in that component file

---

## Import Conventions

```tsx
// Type-only imports
import type { Project, ViewType } from '../types';

// Runtime imports
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion';
import { Home, Wallet } from 'lucide-react';

// Local imports — relative paths
import { useMockProjects } from '../services/mock/useMockProjects';
import Toast from './Toast';
```

- `import type { }` for all TypeScript-only imports
- Relative paths (no `@/` alias in src/ — alias maps to project root)

---

## Icons

All icons from **lucide-react**. Import individually (not barrel):
```tsx
import { Sun, Moon, TrendingUp } from 'lucide-react';
```

---

## Testing

Follow root `TDG.md` conventions. Co-located tests in `src/`:
```
src/App.test.tsx                     # App-level rendering tests
src/components/ComponentName.test.tsx # Component tests (next to component)
src/services/ServiceName.test.ts     # Service/logic tests
```

- Vitest + React Testing Library + jsdom
- Run single test: `npx vitest run src/path/to/file.test.tsx`
- Coverage: `npx vitest run --coverage`
