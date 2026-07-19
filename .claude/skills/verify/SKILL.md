---
name: verify
description: How to run and visually verify the Nonna's Kitchen client + API locally
---

# Verifying Nonna's Kitchen

## Servers
- API: `cd server && npm run dev` → http://localhost:8080 (needs server/.env: MONGODB_URI, JWT_SECRET, CLIENT_URL, STRIPE_SECRET_KEY). Health: `GET /api/v1/health`.
- Client: `cd client && npm run dev` → http://localhost:5173 (Vite proxies /api/* to 8080). Check `ss -ltn | grep -E ':(8080|5173)'` first — they are often already running; don't restart them.
- Backend regression gate: `cd server && npm run smoke` (23 checks; **re-seeds the DB** via seed.js).

## Headless browser (screenshots)
No playwright package is installed in the repo. Cached browser lives at
`~/.cache/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell`
(revision doesn't match any installed playwright — pass it as `executablePath` explicitly):

```js
const { chromium } = require("playwright"); // npm i playwright in scratchpad
const browser = await chromium.launch({ executablePath: "<path above>" });
```

Wait with `{ waitUntil: "networkidle" }` (SPA fetches on mount). Detect mobile overflow with
`document.documentElement.scrollWidth > clientWidth` at a 375px viewport.

## Useful facts
- Seed logins (password `password123`): `guest@demo.com`, `manager@demo.com` (manages Nonna Carmela + Assunta).
- Seed data has **no verified host** — to see the VerifiedBadge, intercept `**/api/v1/**` with page.route and flip `verified: true` in the JSON (no DB mutation).
- Catalog empty state: `/experiences?city=zzzz`. Language toggle: click the `EN`/`IT` buttons in the navbar.
- Prettier: `npm run format:check` at root; `server/pay-test.js`, `server/smoke-test.js`, `client/src/components/BookingCard.jsx` fail it pre-existing — check only your files with `npx prettier --check <files>`.
