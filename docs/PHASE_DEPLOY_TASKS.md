# Nonna's Kitchen — Deploy Task Prompts (Render + Vercel)

> Same workflow: one task at a time, **plan mode**, review, approve, verify,
> `npm run smoke`, commit, push, `/clear`, next.
>
> **Decisions already made** (to be recorded in SPEC.md/CLAUDE.md as tasks land):
>
> - **Two origins** as per SPEC §8: API on Render, client on Vercel. In dev the
>   Vite proxy hides CORS; in production it does not → the server needs the
>   `cors` package (stack deviation, recorded in Task 18) and the client needs
>   a `VITE_API_URL` build-time env var (Task 19). CLAUDE.md's "Express serves
>   client/dist/" line is superseded and must be corrected in Task 18.
> - **Production DB**: same Atlas cluster, separate database name
>   (`nonnas-kitchen-prod`) via the connection string. Seeded once, manually.
> - **Fresh `JWT_SECRET` for production** — never reuse the dev one.
> - **Stripe stays in TEST MODE** in production. The live key never exists in
>   this project.
> - **Deploy order**: Render first (placeholder `CLIENT_URL`) → Vercel →
>   update `CLIENT_URL` on Render → redeploy.

---

## Task 18 — Production readiness (server)

```
Read CLAUDE.md and docs/SPEC.md. Task: make the Express server deployable on
Render. Code changes only — no deploying yet.

- PORT from process.env.PORT with fallback 8080 (Render assigns its own).
- npm install cors. Enable it with origin = CLIENT_URL from .env (comma-safe:
  a single origin is enough). In dev, if CLIENT_URL is missing, allow
  http://localhost:5173. Record the deviation in CLAUDE.md (stack section:
  cors added for the two-origin production setup) and fix the architecture
  line: production is Render API + Vercel client, Express does NOT serve
  client/dist. Update SPEC §8 accordingly.
- Verify every env read (MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY,
  CLIENT_URL) fails loudly and clearly if missing — one startup check, no
  scattered crashes.
- Add "start": "node server.js" to server/package.json (Render uses it;
  nodemon stays dev-only).
- .env.example: confirm all four variables are present with comments.

Do NOT touch the client. Do NOT change any route logic.

Acceptance criteria: server still runs locally with npm run dev; npm run
smoke passes; starting without an env var prints a clear message naming the
missing variable.
```

## Task 19 — Production readiness (client)

```
Task: make the client deployable on Vercel. Code changes only.

- Introduce an API base URL: import.meta.env.VITE_API_URL, empty string in
  dev (the Vite proxy keeps working unchanged). Apply it in ONE place — the
  shared fetch helper(s) (useFetch / authFetchJSON), not in every component.
- client/.env.example with VITE_API_URL and a comment (empty for dev,
  Render URL in production).
- vercel.json in client/ with the SPA rewrite (all routes → /index.html) so
  React Router deep links like /experiences/:id survive a hard refresh.
- npm run build must complete without errors; check the preview
  (npm run preview) still works against the local server.

Do NOT touch the server. Do NOT add any other config.

Acceptance criteria: dev behavior unchanged (proxy still works); npm run
build succeeds; grep confirms no component fetches a hardcoded URL.
```

## Task 20 — Deploy server on Render (guided checklist)

```
Task: deploy the Express server on Render. This is operator work — Claude
guides, I click. Produce a checklist I execute, then we verify together.

- Atlas: create the production database (same cluster, dbname
  nonnas-kitchen-prod in the connection string); Network Access must allow
  Render (0.0.0.0/0 is acceptable for the MVP — note it as tech debt).
- Render: new Web Service from the GitHub repo, root directory server/,
  build command npm install, start command npm start.
- Env vars on Render: MONGODB_URI (prod dbname), JWT_SECRET (freshly
  generated, e.g. openssl rand -hex 32), STRIPE_SECRET_KEY (test key),
  CLIENT_URL (placeholder https://example.com for now — updated in Task 21).
- Free tier note: the service sleeps after inactivity; first request can
  take ~50s. Acceptable for the demo; mention it in the exam if asked.

Acceptance criteria: GET <render-url>/api/v1/health returns { status: "ok" };
Render logs show a clean startup with DB connected; no secret has been
pasted into the chat or committed.
```

## Task 21 — Deploy client on Vercel + wire the two together

```
Task: deploy the client on Vercel and close the CLIENT_URL loop.

- Vercel: new project from the repo, root directory client/, framework
  preset Vite. Env var VITE_API_URL = the Render URL (no trailing slash).
- After the first deploy, copy the Vercel production URL and update
  CLIENT_URL on Render → trigger a Render redeploy (CORS + Stripe
  success/cancel URLs now point to the real client).
- Verify CORS: from the Vercel site, the catalog must load (no CORS errors
  in the console).

Acceptance criteria: the Vercel URL shows the landing page with seeded...
wait — no seed yet, empty states are expected and fine. Catalog loads
without console errors; login page reachable via deep link (hard refresh on
/login works thanks to the rewrite).
```

## Task 22 — Production seed + smoke against production

```
Task: data in production and a regression net that can point at it.

- Seed: run node seed.js locally with MONGODB_URI temporarily pointing at
  the prod database (one-off shell env var, NOT saved in .env). Verify the
  catalog on Vercel now shows the experiences.
- Parametrize server/smoke-test.js: read the base URL from an env var
  (SMOKE_URL, default http://localhost:8080) so the same suite can run
  against Render: SMOKE_URL=<render-url> npm run smoke. Same for its
  mongoose connection (it reuses MONGODB_URI). NOTE: the suite re-seeds /
  mutates data — acceptable on the demo DB, document it in a comment.
- Full manual pass on production: register → request → accept (manager) →
  Pay now → 4242 → verify on success page → Show address.

Acceptance criteria: SMOKE_URL=<render-url> npm run smoke → all pass (or
Stripe SKIPs if key absent); the full Stripe test payment works end-to-end
on the production URLs; address revealed only at the end.
```

## Task 23 — Deploy review

```
Task: verification pass, no new features — same format as Tasks 10/17.

1. SPEC §8 vs reality: env vars on both platforms, URLs, DB name. List
   deviations.
2. Secret hygiene: git log/grep for any leaked key, .env not committed,
   no secret ever pasted in chat.
3. Prod behavior: CORS locked to the Vercel origin (a request from another
   origin fails), address/password never in any prod response, EN/IT parity
   on the deployed client.
4. Known limits to record as tech debt: Render free-tier cold start, Atlas
   open network access, smoke suite mutates the demo DB, no CI.
5. Report: done / deviations / tech debt. Do NOT fix — report first.
```

---

## Rules of engagement (unchanged)

1. One task → plan → review → approve → verify with YOUR hands →
   npm run smoke → commit → push
2. Reject any plan that exceeds the task's scope
3. Decisions live in SPEC.md/CLAUDE.md, not in the chat
4. Secrets NEVER in chat, client code, or commits. Stripe TEST MODE ONLY.
