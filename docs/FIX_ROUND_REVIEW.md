# Fix Round Review (Task 31)

> Verification pass over FIX #1–#7 from docs/UAT_FINDINGS_FINAL.md
> (Tasks 24–30). Report only — no new fixes. Same format as the
> Task 10/17/23 reviews. Date: 2026-07-18.

## 1. Fixed — all 7 FIX items confirmed

| Finding | Task | Evidence |
|---------|------|----------|
| F9 password min length | 24 | Prod `POST /auth/register` with a 3-char password → `400 {"error":"password must be at least 8 characters"}`; rule recorded in SPEC §2 |
| F5 host page reachable | 25 | Prod `GET /hosts/:id` (seeded id from the catalog) returns bio/city/photos; host name links from detail + cards (Task 25 + follow-up commit b23fe97) |
| F10 edit/delete experiences | 26 | `HostExperienceList.jsx` exposes edit (→ `HostExperienceEdit.jsx`) and delete with confirm dialog against the existing PATCH/DELETE APIs |
| F1 auth survives Stripe redirect | 27 | `AuthContext.jsx` persists `{ token, user }` in sessionStorage and rehydrates on mount; decision recorded in SPEC §4 and CLAUDE.md |
| F11 i18n gaps | 28 | See nuance below — resolved, but mostly en route before Task 28 |
| F8 seats-left staleness | 29 | `refetch()` after mutations in detail/bookings/inbox; sibling fix via `experiencesRefreshKey` in `Dashboard.jsx` (see nuance below) |
| F13 tag dropdown | 30 | `Experiences.jsx` renders a `<select>` derived from fetched tags, synced with `?tag=` via useSearchParams; deployed bundle on Vercel contains the Task 30 keys |

### Nuances worth recording (audit outcomes)

- **F11**: the Task 28 audit found the dictionaries **already at full
  parity (115/115)** and the B5 (409 duplicate) / B11 (403 own-host)
  error mappings **already in place** — they were fixed en route by
  Tasks 24–27, each of which kept en.json/it.json in parity as required
  by the fix-round rules. Task 28's actual delivered value was
  **deduplication**: unifying the scattered error→i18n-key logic into
  `client/src/utils/apiError.js` so no component maps (or leaks) raw
  server strings on its own.
- **F8**: of the three views named in the task, **two were already
  correct**; the real bug was **sibling staleness** — a manager
  decline in the requests inbox updated the inbox but left the
  neighbouring `HostExperienceList` seats count stale. Fix: the inbox's
  `onChange` bumps `experiencesRefreshKey` in `Dashboard.jsx`, forcing
  the list to re-fetch.

## 2. Reopened decisions recorded

- **Password min 8 chars**: SPEC.md §2 (`User.password: required, min 8
  chars`). ✔
- **sessionStorage auth** (revises Task 7's in-memory decision): SPEC.md
  §4 (rehydration, same-tab Stripe redirect rationale, 1h JWT caveat) and
  CLAUDE.md auth bullet. ✔
- **Dictionary parity**: en.json and it.json both at **116/116 keys**,
  zero missing in either direction (checked programmatically). ✔

## 3. Smoke results

- **Local** (`npm run smoke`, server/): **19/19 passed** — auth, booking
  lifecycle, address privacy, Stripe checkout/verify guards.
- **Production**: verified with **read-only checks only** — the smoke
  suite reseeds the target DB and creates persistent bookings
  (DEPLOY_REVIEW §4), so pointing it at Render would wipe the prod demo
  data. Deliberate deviation from this task's original text. Checks run
  against `https://nonnas-kitchen.onrender.com`:
  - `GET /experiences` → 200, 9 experiences, no `address` field leaked
    (cold start ~22s, known free-tier debt);
  - `GET /hosts/:id` → 200 with full public profile;
  - `POST /auth/register` (3-char password) → 400, translated-key-mapped
    client-side;
  - Vercel client bundle contains the Task 30 tag-dropdown strings →
    latest build is live.

## 4. Operator findings / new tech debt

- **Vercel silently skipped three deploys.** Commits `724b121` (Task 28),
  `f493a4d` (Task 29) and `b892288` (Task 30) produced **no Vercel
  deployment at all**; production kept serving the Task 27 build until an
  empty commit (`5d4c544`) retriggered the pipeline. Suspected cause: the
  project's "Skip deployments" / ignored-build-step setting deciding the
  commits didn't affect the client. **Action item**: inspect the Vercel
  project settings (Git → Ignored Build Step) before the next phase;
  until then, verify after every push that a deployment was actually
  created. Recorded as deploy-pipeline tech debt.
- `client/.env.example` suggests `nonnas-kitchen-api.onrender.com` as the
  API URL; the real service is `nonnas-kitchen.onrender.com`. Cosmetic,
  but it cost a wrong curl during this review.

## 5. Still open (unchanged, by design of the triage)

- **DESIGN**: F2 (guest empty state), F14 (inbox redesign) — design phase.
- **DEFER**: F3 (profile page), F4 (richer experience fields) — Phase 3
  candidates; F15 (photo upload) — v2.
- Pre-existing tech debt from DEPLOY_REVIEW (cold start, Atlas 0.0.0.0/0,
  destructive smoke, no CI, no `engines` field) — unchanged.
