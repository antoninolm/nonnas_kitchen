# Design Review + Mobile Pass (Task 36)

> Verification pass over the design phase (Tasks 32–35, "Quaderno di
> Nonna"). Report only — no fixes applied; remediation is decided
> together. Same format as the Task 10/17/23/31 reviews.
> Date: 2026-07-19.

## 1. Token compliance — PASS

Static sweep of `client/src/` (all `.jsx` + `index.css`):

- **Zero** hex/`rgb()`/`hsl()` literals outside the `@theme` block in
  `index.css` (the token definitions themselves).
- **Zero** Tailwind default-palette classes (`bg-red-500`,
  `text-gray-*`, …), **zero** arbitrary-value utilities (`-[...]`),
  **zero** inline `style={}` attributes.
- Fonts: Caveat (`font-display`) appears exactly in the three allowed
  places — the base `h1, h2` rule (`index.css:63`), the navbar wordmark
  (`Navbar.jsx:20`), the verified badge (`VerifiedBadge.jsx:9`). CTAs,
  prices, labels and body are all Lora via `:root` / `.btn-*` /
  `.field`. Google Fonts link in `index.html` matches CLAUDE.md exactly
  (Caveat 600;700 + Lora 400;500;600).
- Neutral utilities in use are token-clean: `accent-accent` on the
  wizard checkbox (`HostNew.jsx:164`), `bg-transparent` /
  `border-transparent` on the language toggle and inactive dashboard
  tab.

## 2. Consistency — PASS, two non-visual notes

- **Cards**: the full recipe `rounded-card border border-dashed
border-border bg-surface p-card shadow-card` is used on all 16 card
  surfaces (catalog cards, detail booking box, host page, forms, login/
  register, dashboard, empty states). Nested cards inside the requests
  inbox (`HostBookingRequests.jsx:65`) deliberately drop
  `bg-surface`/`shadow-card` (flat inner sheet on an already-elevated
  card) — consistent in both inbox instances, reads as intended.
- **Buttons**: every CTA goes through `.btn-primary`/`.btn-secondary`
  (23 uses). The only non-`.btn` buttons are the dashboard tabs and the
  EN/IT toggle — both intentional pill/tab controls, token-styled.
- **Form fields**: every `input`/`select`/`textarea` uses `.field`
  (25 uses); labels use `.form-label`, errors `.form-error`. Verified in
  the browser that all fields compute to the same `#C1602E` 1px border
  (an apparent two-tone border in scaled screenshots is an artifact).
- **Badges**: all status badges share `rounded-pill px-3 py-1 text-sm`
  with the same color language (accent-soft = pending, success =
  confirmed/published, outlined secondary = cancelled/completed/draft).
  VerifiedBadge differs (py-0.5, Caveat, larger) by design.

Notes (code quality, not visual):

- `STATUS_BADGE` for bookings is duplicated **identically** in
  `BookingCard.jsx:6` and `HostBookingRequests.jsx:7` (the experience
  variant in `HostExperienceList.jsx:8` is legitimately different).
  Candidate for a shared constant if we ever touch these files again.
- `BookingCard.jsx` still fails `prettier --check` (pre-existing,
  recorded in the verify skill).

## 3. Mobile pass @ 375px — PASS on all routes

Headless Chromium, 375×812, full-page screenshots + programmatic
overflow check (`scrollWidth > clientWidth`) + console/page-error
capture, in **both EN and IT**. 14 states covered: landing, catalog,
catalog empty state, detail (logged in, booking box), host profile,
login, register, wizard (`/hosts/new`), create experience, edit
experience (pre-filled), dashboard "My bookings" (guest, 4 statuses),
dashboard "My profiles" (manager, 2 hosts + inbox), dashboard
"My profiles" empty state (pure guest → F2), bookings success
(fallback state).

- **Zero horizontal overflow** and **zero console errors** on every
  state, both languages.
- Nothing cramped: forms stack single-column, card grids collapse to
  one column, dashboard tabs and inbox actions fit, logged-in navbar
  wraps to three tidy rows (Task 33 fix holding).

Minor findings (new, small):

- **F18 (S3, copy)**: no singular pluralization — "1 seats" /
  "1 posti" in `BookingCard` and the requests inbox. Cosmetic; an
  `n === 1` key variant would fix it.
- **F19 (S3, copy/UX)**: cancelled bookings still show "Not paid yet"
  next to the Cancelled badge — payment status is noise on a cancelled
  card.
- **F20 (S3, cosmetic)**: `/bookings/success` fallback ("We couldn't
  confirm your payment…") is a bare paragraph, not on a card like every
  other state. Only reachable by visiting the URL without a Stripe
  `session_id`.

## 4. EN/IT parity — PASS

- Flattened key sets: **122 = 122**, identical keys, no empty values
  (script-verified). The 8 value-identical pairs are cognates/brand
  ("Email", "Password", "Dashboard", "Tag", "Nonna's Kitchen").
- Italian visual pass (all 13 mobile states + desktop spot checks):
  dates localized ("6 agosto 2026"), prices "55,00 €", statuses and
  empty states translated, no layout breakage from longer Italian
  strings, no hardcoded English found. UGC (titles, stories) stays in
  its original language per SPEC §5.

## 5. Smoke + production — PASS, one operational finding

- `npm run smoke`: **19/19 passed** (re-seeds the DB — see the finding
  below).
- Production (main at 6b46366 pushed): `nonnas-kitchen.vercel.app`
  serves the full restyle — verified at 375px and 1280px (landing,
  catalog, logged-in dashboard), zero overflow, palette/typography
  identical to local. API health OK on
  `nonnas-kitchen.onrender.com/api/v1/health`.
- ⚠️ **F21 (operational)**: local `server/.env` points `MONGODB_URI` at
  **`nonnas-kitchen-prod`** — local dev and every `npm run smoke`
  (including this review's run) re-seed and mutate the _production_
  database. Harmless today (prod data is the seed data; Task 22 already
  ran smoke against prod), but a separate dev database is strongly
  recommended before any real data exists.
- Leftover already on record (FIX_ROUND_REVIEW §74): `client/
.env.example` still suggests the dead `nonnas-kitchen-api.onrender.com`
  URL; the live API is `nonnas-kitchen.onrender.com`.

## 6. UAT findings closed by the design phase

- **F2 — resolved (Task 35)**: pure guest's "My profiles" tab now shows
  a proper empty state ("You don't manage any nonna yet…") with a
  `Create her profile` CTA into the wizard. Verified at 375px with
  `guest@demo.com`. Recorded in `docs/UAT_FINDINGS_FINAL.md`.
- **F14-reduced — resolved (Task 35)**: requests inbox redesigned as
  token-styled cards grouped per nonna with status badges and
  accept/decline actions. The deferred parts — requester photo and
  date/nonna/seats filtering — depend on **F3** (user profile/avatar),
  planned as a Phase 3 candidate. Recorded in
  `docs/UAT_FINDINGS_FINAL.md`.

## 7. Accepted deviations & known limits (recorded, no action)

- **Dark mode removed** (Task 32): single paper palette,
  `color-scheme: light` — the notebook metaphor doesn't invert.
- **Navbar mobile fix** landed in Task 33 (wrapping rows at narrow
  widths).
- **Focus-ring a11y upgrade** landed in Task 34 (`.field:focus` 2px
  accent outline).
- **Date input placeholder** (`mm/dd/yyyy`) follows the browser locale,
  not our i18n — native `<input type="date">` behavior, recorded as a
  known limit, not a bug.

## Verdict

The design phase holds: token layer airtight, one shared visual
language across all pages, fully usable at 375px in both languages,
production in sync. Open items for a joint decision: F18/F19/F20
(cosmetic), F21 (dev DB separation), `.env.example` URL leftover,
STATUS_BADGE dedup.
