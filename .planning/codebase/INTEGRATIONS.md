# Integrations

## External API Integrations

### Google Gemini AI (`@google/genai` ^1.29.0)
- **Purpose**: AI-powered interactions (Gemini AI API)
- **Auth**: `GEMINI_API_KEY` environment variable
- **Status**: Configured as dependency; runtime calls to Gemini via AI Studio

### AI Studio Platform
- **App ID**: `93778f08-d4b1-471c-a9a9-0b6c213fdcd9`
- **Capability**: `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`
- **Env Injection**: AI Studio auto-injects `GEMINI_API_KEY` and `APP_URL` at runtime
- **Hosting**: Cloud Run service managed by AI Studio

## No Database
- No SQLite, PostgreSQL, MongoDB, or any database dependency
- All data is mock/in-memory state (React `useState`)

## No Blockchain Integration
- Wallet connect is simulated (mock addresses, mock balances)
- No ethers.js, web3.js, or viem dependency
- Smart contract interactions are simulated with `setTimeout` delays

## Potential Integrations (Not Yet Implemented)
- MetaMask / Phantom / WalletConnect — UI modals exist but are mock/simulated
- SEC Sandbox compliance oracle — referenced in UI but not real
- IoT telemetry from Siwasolar inverters — simulated with random metrics
