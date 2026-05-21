# Codebase Stack

## Runtime & Language
- **Node.js** (v22+) — runtime
- **TypeScript 5.8** — strict typed superset of JS, ES2022 target
- **Module**: ESM (`"type": "module"` in package.json)

## Frontend
- **React 19** — UI library with useReducer/useState pattern
- **Vite 6** — bundler + dev server (HMR-friendly, port 3000)
- **Tailwind CSS v4** — utility-first CSS (via `@tailwindcss/vite` plugin)
- **Motion v12** — animation library (used in AnimatedNumber component)
- **Lucide React** — icon set (20+ imported icons)

## Backend / Server
- **Express 4** — HTTP server (configured but no server code detected in src/)
- **dotenv** — environment variable loading (`GEMINI_API_KEY`, `APP_URL`)

## AI / External APIs
- **Google Gen AI SDK** (`@google/genai` ^1.29.0) — Gemini AI API

## Developer Tooling
- **TypeScript** (`tsc --noEmit`) — type checking via `npm run lint`
- **Vite** — dev/build/preview
- **PostCSS + Autoprefixer** — CSS processing
- **esbuild** — bundling utilities
- **tsx** — TypeScript execution for scripts
- **No test framework** detected (no jest, vitest, playwright, etc.)

## Project Identity
- **Name**: SolaraConnect (package: `react-example`)
- **Platform**: AI Studio app (Gemini) — server-side Gemini API capability
- **Description**: Web3 decentralized solar finance platform bridging RWA (Real-World Assets) with DeFi lending
