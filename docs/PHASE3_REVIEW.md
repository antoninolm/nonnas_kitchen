# Phase 3 Final Review + Production Pass (Task 43)

> Verification pass over Phase 3 (Tasks 37–42: profile/interests,
> personalized featured, dashboard IA, bidirectional reviews + ranking, 5
> experience fields). Report only — no fixes applied; remediation is
> decided together. Same format as the Task 10/17/23/31/36 reviews.
> Date: 2026-07-20.

## 1. Requests #1–#8 vs delivered

| # | Request | Delivered in | Status |
|---|---------|---------------|--------|
| 1 | Logo next to navbar wordmark | Task 38a (+ `7e903f3` "logo on auth pages") | ✅ confirmed — `Navbar.jsx:23`, `AuthHeader.jsx` |
| 2 | Personalized featured ("In evidenza per te" / "Picked for you") | Task 40 | ✅ confirmed live — heading switches once interests are set, catalog-fetched list re-ranked client-side via `useMemo` (`Home.jsx`, `utils/matchScore.js`), fallback to default title/order verified logged-out |
| 3 | Login page tagline | Task 38b | ✅ confirmed — `auth.login.subtitle` in both dictionaries |
| 4 | Center main nav links | Task 38c | ✅ confirmed — `Navbar.jsx:18`, `sm:grid-cols-[1fr_auto_1fr]` + `justify-self-center`, verified at desktop width |
| 5 | "Ciao, {name}" links to /profile | Task 37 | ✅ confirmed — `Navbar.jsx:45-50` |
| 6 | Dashboard restructure (profiles hub) | Task 39 | ✅ confirmed — personal-profile card + managed-nonna cards → `/dashboard/hosts/:id` |
| 7 | No mixing made/received bookings | Task 39b | ✅ confirmed — "Fatte"/"Ricevute" sub-tabs, `GET /bookings/received` |
| 8 | Bidirectional reviews + host ranking | Task 41 | ✅ confirmed live both directions (§3) — **bundled into the same commit as Task 42, see §2** |
| 9 | Chat/messaging | — | Cut by decision, out of scope per CLAUDE.md. **Roadmap item (§7)** |

All eight delivered requests were re-confirmed either by reading the
current code or by exercising them live in the browser (§3), not solely
from commit messages.

## 2. SPEC.md vs code — Phase 3 changes

**User.interests + profile routes (Task 37) — matches.**
`server/models/User.js` has `interests: { city, maxPrice, tags }`, all
optional. `GET/PATCH /users/me` (`server/routes/users.js`) whitelist
`{ name, avatar, interests }` by destructuring — email/password changes
are impossible by construction, matching the SPEC note. `maxPrice >= 0`
validated (400 otherwise).

**Review model + eligibility + routes (Task 41) — matches exactly.**
`server/models/Review.js`'s schema, the `{ booking, direction }` unique
index, and the two `recompute*Rating` statics are a verbatim match for
SPEC §2. `POST /bookings/:id/review` (`bookings.js:158`) infers direction
from the requester (guest → `guestToHost`, any manager → `hostToGuest`),
403s otherwise, and enforces the recorded eligibility deviation
(`confirmed && paid && date < now`, since `status` never reaches
`"completed"` via any code path) exactly as documented in the SPEC note.

**Ranking sort (Task 41) — matches, one micro-inefficiency.**
`GET /experiences` sorts `{ date: 1 }` at the DB level, then **re-sorts
the whole result in JS** by `ratingAvg desc, ratingCount desc, date asc`
(`experiences.js:211-226`). The DB-level sort is redundant — it's
immediately overwritten by the JS sort — harmless at this data volume but
worth removing if this file is touched again. Verified live: after a
review, Carmela (avg 5) ranks above Assunta (avg 4), both above the five
unrated hosts (§3).

**5 experience fields (Task 42) — matches.**
`Experience.js` has `dietaryOptions/menu/languagesSpoken/
conversationTopics` (arrays) + `houseRules` (string, max 500), all
optional. `ExperienceDetail.jsx` renders them exactly as designed: pills
for dietary/languages, a bulleted menu list, an accent-soft "conversation
topics" block, a bordered house-rules note — confirmed on
`/experiences/:id` (§3, §4).

**Dashboard IA (Task 39/39b) — matches.**
`Dashboard.jsx` is the profiles hub (personal card + managed-nonna list)
plus "Fatte"/"Ricevute" sub-tabs; `HostManage.jsx` is the per-nonna page
(header, experiences, "Add experience") with the booking-requests inbox
removed, matching SPEC §4's "supersedes Task 35 / sub-tabs added in Task
39b" note. `GET /bookings/received` populates guest name+avatar and the
nested host, matching the populate-whitelist convention.

**Undocumented gap: "Task 42-bis" + a one-task-per-commit violation.**
`docs/SPEC.md` documents a **"Task 42-bis"** — `User.ratingAvg`/
`ratingCount` denormalization, the public guest-reputation page
(`GET /users/:id`, `GET /users/:id/reviews`, `/users/:id` route +
`UserProfile.jsx`), and `HostProfile.managers` now populated as
`{ _id, name, avatar }` on `GET /hosts/:id` — **but this task does not
exist in `docs/PHASE3_TASKS.md`.** `git log --oneline -- docs/SPEC.md`
shows the commit sequence stops at Task 39b, then jumps straight to a
single commit, `7ca7095 "Task 42"`, whose diff (27 files, 1268
insertions) contains **Task 41 (reviews) + Task 42 (5 fields) + the
undocumented Task 42-bis together.** There is no separate commit for
Task 41 at all. This is a real violation of CLAUDE.md's "one task = one
commit" convention and an out-of-band scope addition that was never
recorded as its own task prompt — flagged here, not fixed (that would
mean rewriting history).

## 3. Full demo run — local, not production (see §4 for why)

Ran the complete Task 37–42 loop end-to-end in a real browser (Playwright
+ headless Chromium), against **local dev** (freshly seeded, identical
code to what's deployed):

register/login → `/profile` set interests (city Rome, budget €60, tag
"pasta") → landing heading switches to "Picked for you" → book "Roman
Carbonara Masterclass" → manager's "Ricevute" shows the request with the
**requester's avatar visible** → Accept → guest's "Pay now" reaches a
real Stripe Checkout session (server-computed amount, `cs_test_...` URL)
→ booking flipped to `paid` (same direct-Mongoose technique
`server/smoke-test.js` already uses, to avoid scripting Stripe's
iframe'd, hCaptcha-protected hosted card form) → "Show address" reveals
the real address → manager leaves a **hostToGuest** review live through
the UI (5★, on the pre-seeded past Assunta booking) → guest's `/profile`
"Your reviews" shows it immediately → catalog re-sorts
(`Carmela:5 > Assunta:4 > five unrated hosts:0`) → `/hosts/:id` shows the
new avg + review list + "Managed by" line.

Every step worked as designed. The **guestToHost** direction (guest
reviews the nonna) was not re-clicked live — both of the demo guest's
seeded past bookings arrive pre-reviewed in that direction by
`seed.js` — but the identical code path (same route, same model method)
is exercised live by `npm run smoke`'s own assertions (§5), including
rating-bounds and avg-math checks.

**Why local instead of production**: see the operational finding below.

## 4. Production data is stale — the demo is not currently ready live

Read-only checks against `nonnas-kitchen.onrender.com`:

- `GET /experiences`: 9 experiences, **all** with `ratingAvg: 0,
  ratingCount: 0` and **empty** `dietaryOptions/menu/languagesSpoken/
  conversationTopics`, no `houseRules`.
- `GET /hosts/:id/reviews` for the top-listed host: `{ reviews: [], avg:
  0, count: 0 }`.
- `GET /users/me` (logged in as `guest@demo.com`): `createdAt:
  "2026-07-19T11:45:..."`, `interests: { tags: [] }` (schema field
  present, never set).

The **code** deployed to Render is current — the `interests` and
`ratingAvg`/`ratingCount` fields exist on documents created before those
fields did (Mongoose schema defaults), and the new routes
(`GET /users/:id`, etc.) respond correctly. But **the data was never
reseeded after Task 41/42** — production has zero reviews and none of
the Task 42 descriptive fields, so the ranking reorder, the review UI,
and the enriched experience detail are all **invisible in production
today**, even though the code driving them is live and correct.

**This needs `npm run seed` run with `SMOKE_URL`/`MONGODB_URI` pointed at
production before the exam demo.** Not done here on purpose — reseeding
prod is a destructive action explicitly outside this report-only task's
scope (same restraint as FIX_ROUND_REVIEW/DEPLOY_REVIEW's "read-only
prod checks only" rule). Flagging this as the single most important
action item in this report: **without a prod reseed, requests #2 and #8
will not be demoable live.**

## 5. Smoke, parity, formatting

- **Local `npm run smoke`: 37/37 passed**, including every Phase 3
  addition — `/users/me` round-trip, review eligibility guards (409/403/
  400), double-review rejection in both directions, avg/count math on
  seeded data, and "catalog ranks rated hosts before unrated hosts."
- **Production**: read-only checks only (§4) — `GET /experiences`,
  `GET /hosts/:id`, `GET /hosts/:id/reviews`, `GET /users/me` all
  200 with the expected (if unseeded) shapes. Never ran smoke/seed
  against Render's DB.
- **EN/IT parity**: **170 = 170** keys, identical sets both directions,
  zero empty values (script-verified).
- **Prettier — new, previously unflagged debt**: `docs/SPEC.md`,
  `server/routes/experiences.js`, and `server/seed.js` (all touched in
  the Task 42 commit) fail `prettier --check`. Not part of the
  already-known `BookingCard.jsx`/`smoke-test.js`/`pay-test.js` failure
  list.

## 6. 375px mobile pass — zero overflow, one console/markup bug found

Headless Chromium at 375×812, both languages, 8 states each (16 total):
`/profile`, `/dashboard` ("Fatte"), `/dashboard` ("Ricevute"),
`/dashboard/hosts/:id`, `/experiences/:id` (with the 5 new fields +
reviews), `/hosts/:id`, `/users/:id`.

- **Zero horizontal overflow** on every state, both languages.
- **New finding — invalid DOM nesting on `/hosts/:id`.**
  `HostProfile.jsx:60` wraps the "Managed by" line in a `<p>`; `Avatar`
  (`Avatar.jsx:18`) renders a `<div>` when the manager has no `avatar`
  URL (the seeded `manager@demo.com`/"Marco Ferrari" has none). A
  `<div>` inside a `<p>` is invalid HTML — the browser silently
  recovers, so it isn't visually broken at 375px or 1280px, but it
  throws a real console error in both languages ("<p> cannot contain a
  nested <div>... will cause a hydration error"), which the Task 36
  design review's "zero console errors on every state" bar would have
  caught had this line existed then. Isolated to this one call site —
  every other `Avatar` usage (`Dashboard.jsx`, `Profile.jsx`,
  `UserProfile.jsx`, `ReviewList.jsx`, `ReceivedBookingCard.jsx`) already
  wraps it in a `<div>`, not a `<p>`.

## 7. Roadmap (not fixed here)

- **Chat/messaging (request #9)**: cut by decision, stays out of scope
  per CLAUDE.md. No further action expected pre-exam.
- **Inbox filtering** (date/nonna/seats on "Ricevute"): deferred since
  UAT's F14, still open — the aggregated view exists but has no filters.
- **Stripe webhooks**: SPEC.md's existing note — `/payments/verify`
  polls synchronously on return from Checkout; a guest who closes the
  tab is never verified. Deferred to v2, unchanged this phase.
- **No CI** (`.github/workflows` absent): carried tech debt from
  DEPLOY_REVIEW, still unaddressed.
- **Production reseed** (§4): not roadmap so much as the single blocking
  pre-exam action — everything else here is a "someday," this one is
  "before demo day."

## 8. Carried-forward backlog (unchanged this phase)

From DESIGN_REVIEW's backlog (`docs/UAT_FINDINGS_FINAL.md`): F18/F19/F20
were fixed in Task 38 (verified in §1 area no regressions found).
Still open, untouched by Phase 3: `client/.env.example`'s dead
`nonnas-kitchen-api.onrender.com` URL, and the duplicated `STATUS_BADGE`
map (`BookingCard.jsx`/`ReceivedBookingCard.jsx`, previously
`HostBookingRequests.jsx` before Task 39b's move/rename).

## Verdict

Phase 3's code is in good shape: every SPEC.md claim checked against the
running code held up, all eight numbered requests are live and correct,
and the full guest↔host↔review↔ranking loop works end-to-end in a real
browser. Two things need attention before the exam, in priority order:
(1) **production needs a reseed** — right now the deployed code is
correct but the deployed *data* makes reviews, ranking, and the 5
descriptive fields invisible; (2) the Task 41/42/42-bis one-commit
bundle and the untracked "Task 42-bis" task are a process gap worth
being able to explain, not a code defect. The `<p>`/`<div>` nesting bug
on `/hosts/:id` and the 3-file Prettier regression are small and
cosmetic-adjacent.
