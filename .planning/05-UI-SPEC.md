---
phase: 5
slug: secondary-market
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-22
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for frontend phases. Generated manually after gsd-ui-researcher timeout.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind CSS v4) |
| Preset | not applicable |
| Component library | none (custom) |
| Icon library | lucide-react |
| Font | Inter / system font stack (Tailwind default) |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps (gap-1) |
| sm | 8px | Compact element spacing (gap-2) |
| md | 16px | Default element spacing (gap-4, p-4) |
| lg | 24px | Section padding (p-6) |
| xl | 32px | Layout gaps (gap-8) |
| 2xl | 48px | Section header spacing (mb-12) |
| 3xl | 64px | Page-level spacing (mb-16) |

Exceptions: pb-20 (80px) bottom padding for mobile nav — project convention

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px (text-sm) | 400 | 1.5 |
| Label | 12px (text-xs) | 500 | 1.5 |
| Heading | 30px (text-3xl) | 700 | 1.25 |
| Display | 36px+ | 700 | 1.25 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | zinc-950 (#09090b) | Full page background, modal backdrops |
| Secondary (30%) | zinc-900 (#18181b) | Sidebar nav, card surfaces |
| Accent (10%) | emerald-600 (#059669) | Primary buttons (Buy, Create Listing), success toasts |
| Destructive | red-500 (#ef4444) | Cancel/delete actions, error toasts |

Accent reserved for: primary action buttons (buy/sell/create), success indicators, active nav states

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (buy) | Buy LP Tokens |
| Primary CTA (sell) | List LP Tokens |
| Empty state heading | No Listings Available |
| Empty state body | No LP tokens are currently listed for sale. Check back later or list your own tokens. |
| Error state | Transaction failed. Please check your wallet and try again. |
| Destructive confirmation | Cancel Listing: This will return your LP tokens to your wallet. This action cannot be undone. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
