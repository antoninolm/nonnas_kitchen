# Deploy Review (Task 23)

> Verification pass, no new features — same format as Tasks 10/17. Do NOT
> fix anything here; this is a report, decisions on remediation are made
> separately.

## 1. SPEC §8 vs reality — env vars, URLs, DB name

**Done / matches:**
- Env vars are an exact match on both sides. SPEC §8 lists `MONGODB_URI,
  JWT_SECRET, STRIPE_SECRET_KEY, CLIENT_URL` for Render; `server.js`'s
  `REQUIRED_ENV_VARS` and `server/.env.example` list exactly those four.
  Client-side `VITE_API_URL` matches CLAUDE.md and is used in exactly one
  place (`client/src/utils/api.js:1`), matching `client/.env.example`.

**Deviations:**
- SPEC.md §8 documents the *mechanism* (env-var-driven CORS/origin) but not
  literal values — the prod DB name (`nonnas-kitchen-prod`) and deploy
  ordering live only in `docs/PHASE_DEPLOY_TASKS.md`, not in SPEC.md itself,
  even though SPEC.md is declared the source of truth. Minor, and arguably
  correct (instance values don't belong in a spec), but worth a one-line
  note in SPEC.md if full accuracy is wanted.
- Live Render/Vercel URLs were not re-verified in this pass. This section is
  based on committed config plus the Task 22 acceptance record (smoke suite
  + manual Stripe pass against Render), not a fresh curl/browser check.

## 2. Secret hygiene

**Repo / git history: PASS.**
- Full `git log --all -p` scanned for Stripe keys, Mongo URIs with
  credentials, JWT secrets, hardcoded passwords: zero matches anywhere,
  including removed/amended commits. Only `.env.example` placeholders and
  `process.env.X` references appear.
- `.env` is gitignored at root; confirmed `server/.env` (present locally) is
  excluded and was never staged. Only `.env.example` files are tracked.
- No hardcoded fallback secrets in code — `JWT_SECRET`/`STRIPE_SECRET_KEY`
  are read strictly from `process.env`, no `|| "..."` fallback anti-pattern.

**Chat: VIOLATED twice, remediated both times.** See §5 (Operator findings)
for detail — the repo/git-history PASS above does not cover secrets pasted
into the chat during the deploy sessions, which is a separate channel.

- Informational, not a leak: `server/seed.js` embeds demo credentials
  (`password123` for the three demo accounts) in source. Fine for a course
  demo DB; if ever run against a real prod DB with real users, rotate/remove
  those accounts afterward.

## 3. Prod behavior

- **CORS — works, but the mechanism is worth being precise about.**
  `server.js:30` sets `cors({ origin: process.env.CLIENT_URL || "..." })`
  with a fixed string. The `cors` package's string-origin branch
  unconditionally echoes that value into `Access-Control-Allow-Origin` — it
  never compares against the request's actual `Origin` header, and there's
  no custom error middleware to reject mismatches. So the server itself
  always answers (curl/Postman from any origin gets a normal 200); it's the
  browser that refuses to let JS on a different origin read the response,
  because the response header won't match that page's origin. "A request
  from another origin fails" is true for the browser-based flows the app
  cares about, but it's not a server-side authorization control.
- **address/password never in prod responses — confirmed via code audit.**
  `User` has both `select:false` on `password` and a `toJSON` transform
  that deletes it (defense in depth). `Experience.address` has only
  `select:false` (no transform) — every route audited (`experiences.js`,
  `bookings.js`, `hosts.js`) only opts in via `.select("+address")` for the
  manager's own experience or the one authorized
  `GET /bookings/:id/address` (guest-only, confirmed && paid gated). No
  leak found. The asymmetry between the two fields' defenses is a
  tech-debt note, not a bug.
- **EN/IT parity — full parity.** `en.json`/`it.json` have identical key
  sets (102/102).
- **Deviation (minor)**: `Navbar.jsx` hardcodes `"EN"`/`"IT"` button labels
  instead of routing them through `t()` — technically violates "no
  hardcoded UI text," though defensible since language-code labels are
  identical in both locales.
- **Deviation (more notable)**: CLAUDE.md states the language choice
  "persists for the session," but `LanguageContext.jsx` keeps `lang` in
  plain `useState` with no `sessionStorage`/`localStorage` write anywhere
  in `client/src`. A full page reload re-runs `navigator.language`
  detection and silently discards a manual toggle.

## 4. Tech debt

- Render free-tier cold start (~50s) — already documented, accepted for
  MVP.
- Atlas Network Access `0.0.0.0/0` — already documented, accepted for MVP.
- **Smoke suite mutates the demo DB — confirmed, more invasive than a
  one-liner suggests.** `smoke-test.js` runs `npm run seed` (full
  wipe+reseed) as step 0, creates 4 persistent bookings, flips one to
  `paid:true` directly via Mongoose (bypassing Stripe), and — if
  `STRIPE_SECRET_KEY` is set — opens a real Stripe Checkout session.
  Nothing is rolled back. The file's own comment already warns against
  pointing `SMOKE_URL` at a real prod DB — running it against Render
  destroys and reseeds whatever's currently there.
- No CI (`.github/workflows` absent) — confirmed.
- No `engines` field in `server/package.json` → Render runs whatever Node
  version its image defaults to (currently Node 24.14.1, an untested major
  for this project). See §5.
- Navbar's hardcoded EN/IT labels; missing session persistence for language
  choice (§3).

## 5. Operator findings (from the deploy sessions)

Findings from the human side of the Render/Vercel deploy work (Tasks
18-22), not derivable from the repo alone — recorded here because they
shape the tech-debt picture and correct the "no secret ever pasted in
chat" assumption from the original Task 23 checklist.

- **Mongo connection string pasted in chat twice.** The password portion of
  `MONGODB_URI` was rotated immediately both times it happened. Net effect:
  secret hygiene is a **PASS** for the repo and git history (§2), but was
  **VIOLATED twice in chat** — both instances remediated by immediate
  rotation, so no credential exposed in chat remained valid afterward.
- **Task 20 (Render deploy) was re-done from scratch.** The original Render
  deploy never actually existed as a working service — it was rebuilt
  rather than repaired.
- **Wrong DB password initially saved on Render.** The API kept responding
  successfully for a period afterward via a stale Mongoose connection held
  open from the previous boot (before the bad password was saved), masking
  the misconfiguration until the next redeploy forced a fresh connection
  attempt, which then failed as expected.
- **`VITE_API_URL` missing from the first Vercel builds.** Confirmed by
  grepping the built client bundle: 0 occurrences of the env var's value.
  Fixed by re-setting the env var on Vercel and redeploying with the build
  cache disabled (a cached build had been silently reusing the bundle built
  before the env var was set).
- **Root Directory misconfigured on both platforms, at different moments**:
  at one point Render was pointed at the client directory instead of
  `server/`, and separately Vercel was pointed at the monorepo root instead
  of `client/`. Both corrected.
- **No `engines` field** in `server/package.json` — Render is currently
  running Node 24.14.1, a major version never explicitly tested against
  during development. Added to tech debt (§4); no fix applied here.
- **`server/.env` temporarily held the production `MONGODB_URI`** during
  diagnostics for the wrong-password issue above, then was restored to its
  local dev value. `.env` is gitignored throughout (§2), so this was never
  at risk of being committed, but it's recorded here since it's exactly the
  kind of moment secret hygiene checks exist to catch.
