# PLAN-04: Phase 4 — Cloudflare Backend + Production Polish

## Goal
Off-chain API services via Cloudflare Workers, risk metrics, and production readiness. Testable locally via `wrangler dev`.

## Tasks

### Task 1: Worker API server
- Create `src/worker/index.ts` — ES modules Worker with Hono (lightweight) or plain fetch handler
- API endpoints:
  - `GET /api/projects/:id/metadata` — project name, location, description, image, installer
  - `GET /api/projects/:id/risk` — risk score breakdown
  - `GET /api/telemetry/:projectId` — energy telemetry data (daily/weekly/monthly kWh)
  - `POST /api/telemetry/:projectId` — record telemetry (IoT endpoint)
- Test locally via `wrangler dev`

### Task 2: D1 Database schema
- Create `src/worker/schema.sql` — D1 SQL tables:
  - `project_metadata` (id, name, location, description, image_url, installer_name, installed_capacity, created_at)
  - `risk_assessments` (project_id, risk_score, location_risk, installer_risk, energy_estimate_risk, last_updated)
  - `energy_telemetry` (id, project_id, recorded_at, kwh, type[ daily/weekly/monthly ], metadata)
- Create `src/worker/db.ts` — D1 query helpers

### Task 3: R2 file upload handler
- Create `src/worker/r2.ts` — Worker handler for R2 document/image operations
- Document upload + public URL generation
- Project image upload endpoint

### Task 4: Update wrangler.toml
- Add Workers config (main entry point, compatibility flags)
- Add D1 binding config (for local dev)
- Add R2 bucket binding config
- Add `[vars]` for environment-specific settings

### Task 5: Frontend API service layer
- Create `src/services/api.ts` — API client for Worker endpoints
- Connect MarketplaceView to fetch project metadata from API
- Connect HomeownerView telemetry to API
- Add risk badge/score component to project detail view

### Task 6: Risk metrics display
- Create `src/components/RiskBadge.tsx` — visual risk indicator
- Update MarketplaceView project cards to show risk breakdown
- Update translations with risk-related keys

### Task 7: Production polish
- CLO-01 attempt: try wrangler pages deploy (blocked on token)
- Smoke test all views with mock mode
- TypeScript strict compliance
- Verify i18n coverage for any new strings
- Run full test suite

### Task 8: Update STATE.md + commit
