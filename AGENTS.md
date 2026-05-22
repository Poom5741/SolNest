# Solaraconnect — Agent Instructions

## Project Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, motion (animation), lucide-react (icons)
- **Backend**: Express
- **AI**: Google GenAI
- **Blockchain**: Solidity contracts + TypeChain type bindings (`contracts/typechain-types/`)
- **Testing**: Vitest, Testing Library, jsdom
- **Language**: TypeScript 5.8 (strict mode), path alias `@/*` → `./*`
- **Deployment**: Cloudflare Workers (`wrangler.toml`)
- **Root**: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`

---

## Mandatory Workflow: TDG (Test-Driven Generation)

**Every implementation MUST follow the TDG Red-Green-Refactor cycle.**

TDG is a Claude Code plugin that enforces test-driven development for AI-assisted coding.
Repository: <https://github.com/chanwit/tdg>

### Prerequisites

Before any implementation work, ensure `TDG.md` exists at the project root.
If it does not exist, run:

```
/tdg:init
```

This detects the project's language, framework, and test commands, then writes `TDG.md`.

`@TDG.md` is the source of truth for:
- Testing framework and commands
- Build commands
- How to run a single test / full suite / coverage

### TDG Phase Cycle

All code changes must go through the three-phase cycle:

#### 1. Red Phase — Write Failing Tests
- Write test specs **before** implementation code
- Commit with: `red: test spec for <description> (#XX)`
- Tests must include at least 1 happy path + N negative cases
- Work on ONE test case at a time; skip or blank the rest

#### 2. Green Phase — Make Tests Pass
- Implement the minimum code required to pass the tests
- Run tests to verify they pass
- Commit with: `green: <description> (#XX)`

#### 3. Refactor Phase — Optimize
- Clean up, extract interfaces, improve structure
- Use interfaces extensively to ensure testability
- Commit with: `refactor: <description> (#XX)`

### Issue Tracking

Every commit MUST include an issue number for traceability:
- Check for issue from user input, branch name, or ask user
- Format: `(#XX)` suffix on all commit messages

### Atomic Commits

When TDG cycle is not applicable (e.g., config changes, docs), use the Atomic Commit skill
to organize changes into logical, complete units. Every commit must pass tests.

---

## File Structure

```
src/
├── components/       # Reusable React components
├── services/         # Backend service layer
│   └── mock/         # Mock service implementations
├── (tests co-located with source: *.test.ts, *.test.tsx)
contracts/
└── typechain-types/  # Auto-generated Solidity type bindings (do not edit manually)
```

Tests are excluded from `tsc` compilation (`tsconfig.json` excludes `src/**/*.test.ts(x)`, `src/setupTests.ts`).

---

## Conventions

- TypeScript strict mode — no `as any`, `@ts-ignore`, or `@ts-expect-error`
- Path alias `@/*` maps to project root `./*`
- `npm run lint` runs `tsc --noEmit` (type-check only, no emit)
- `npm test` runs vitest once; `npm run test:watch` for watch mode
- `contracts/typechain-types/` is auto-generated — never edit manually

---

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
| `npm test` | Run tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
