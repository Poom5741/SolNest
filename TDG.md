# TDG Configuration — Solaraconnect

## Project Information

- **Language**: TypeScript 5.8 (strict mode)
- **Framework**: React 19 + Vite 6
- **Backend**: Express
- **Test Framework**: Vitest + React Testing Library + jsdom
- **Styling**: Tailwind CSS v4
- **Animation**: motion (framer-motion)
- **Icons**: lucide-react
- **Blockchain**: Solidity contracts + TypeChain type bindings
- **Deployment**: Cloudflare Workers (wrangler.toml)

## Build Command

```bash
npm run build
```

## Test Command

```bash
npm test
```

## Single Test Command

```bash
# Run a specific test file
npx vitest run path/to/file.test.ts

# Run a specific test by name
npx vitest run -t "test name pattern"
```

## Coverage Command

```bash
npx vitest run --coverage
```

## Lint Command

```bash
npm run lint
```

> Runs `tsc --noEmit`. Type-checks only, no emit.

## Test File Patterns

- Test files: `*.test.ts`, `*.test.tsx`
- Tests are co-located with source files
- Setup file: `src/setupTests.ts`
- Tests excluded from `tsc` compilation via `tsconfig.json`

## Project Conventions

### Path Alias

- `@/*` maps to project root `./*`

### Component Patterns

- Functional React components with TypeScript
- Tailwind utility classes for styling
- motion (framer-motion) for animations
- lucide-react for icons

### File Structure

```
src/
├── components/       # Reusable React components
├── services/         # Backend service layer
│   └── mock/         # Mock service implementations
└── (tests co-located: *.test.ts, *.test.tsx)

contracts/
└── typechain-types/  # Auto-generated Solidity type bindings (do not edit manually)
```

### Testing Patterns

- Vitest as test runner
- React Testing Library for component tests
- jsdom as DOM environment
- Co-located tests alongside source files

### Type Safety

- TypeScript strict mode — no `as any`, `@ts-ignore`, or `@ts-expect-error`
- Never suppress type errors

## TDG Workflow

All implementations follow the Red-Green-Refactor cycle:

### 1. Red Phase — Write Failing Tests
- Write test specs **before** implementation code
- Commit with: `red: test spec for <description> (#XX)`
- Tests must include at least 1 happy path + N negative cases
- Work on ONE test case at a time; skip or blank the rest

### 2. Green Phase — Make Tests Pass
- Implement the minimum code required to pass the tests
- Run tests to verify they pass
- Commit with: `green: <description> (#XX)`

### 3. Refactor Phase — Optimize
- Clean up, extract interfaces, improve structure
- Use interfaces extensively to ensure testability
- Commit with: `refactor: <description> (#XX)`

### Issue Tracking

Every commit MUST include an issue number for traceability:
- Check for issue from user input, branch name, or ask user
- Format: `(#XX)` suffix on all commit messages

## References

- `AGENTS.md` — Full project documentation and conventions
