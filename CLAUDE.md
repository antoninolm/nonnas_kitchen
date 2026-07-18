Nonna's Kitchen — CLAUDE.md

What this project is

Nonna's Kitchen is a platform for intergenerational culinary experiences: grandchildren (registered users) create and manage online profiles for their grandmothers/grandfathers (non-digital hosts), publish experiences ("come to my nonna's home, learn the recipe, eat together"), and guests (young people, students, expats) book and pay.

Final project for a full-stack course. Priority: a working demo and understandable code > completeness and optimization.

Educational context (important)

This project is driven by a student who must understand and defend every line at the exam.


After each implementation, briefly explain the decisions made and the concepts applied.
Always prefer the simplest, most readable solution over the cleverest one.
If a design decision is ambiguous or not covered by docs/SPEC.md, ask before proceeding.


Locked tech stack (do not deviate)


Server: Node.js, Express 5, pure ESM (import/export, never require), Mongoose 9
Client: React 19 + Vite, React Router DOM 7, Tailwind CSS 4
Auth: JWT (jsonwebtoken, 1h expiry) + bcrypt (10 salt rounds) + helmet + dotenv — client persists { token, user } in sessionStorage (not localStorage), rehydrated on mount, so a same-tab Stripe redirect keeps the session; a new tab or closed tab still requires login. Revises Task 7's original in-memory-only decision (Task 27)
CORS: cors package, origin = CLIENT_URL (dev fallback: http://localhost:5173) — Render (API) and Vercel (client) are different origins in production (Task 18)
Payments: Stripe via the Express server (POST /api/v1/payments/checkout-session, POST /api/v1/payments/verify) — the checkout amount is computed server-side from the DB (only Express has DB access); supersedes the earlier Vercel-serverless-function plan (Task 14)
DB: MongoDB Atlas
Deploy: Vercel (client), Render (Express server)
i18n: custom implementation via React Context + JSON dictionaries (no external i18n library)


⚠️ Do not install libraries not listed here without asking. Do not use patterns from older versions (no deprecated React Router v6 APIs, no CommonJS).

Architecture


Monorepo without shared tooling: server/ + client/ + root
Dev: Vite proxy /api/* → http://localhost:8080
Production: Render hosts the Express API only; the client is a separate static deployment on Vercel — different origins, so the API enables CORS restricted to CLIENT_URL (Task 18)
Versioned API: all routes under /api/v1


Internationalization (i18n)


UI available in English (default) and Italian
Implemented with a LanguageContext + JSON dictionaries (client/src/i18n/en.json, client/src/i18n/it.json) and a useTranslation() custom hook
Initial language auto-detected from navigator.language (it-* → Italian, everything else → English); user can switch manually via a toggle in the navbar; choice persists for the session
Only UI strings are translated. User-generated content (experience titles, stories, bios) stays in the language it was written in — do not attempt machine translation
Every new component must use the translation hook for its strings — no hardcoded UI text


Source of truth

The data model, API routes, client pages and development phases are defined in docs/SPEC.md. Do not invent fields, routes or features not present there. If a change is needed, propose an update to the file — do not improvise in code.

Conventions


Code, variable names, fields and routes in English; all UI strings through the i18n dictionaries
Formatting: Prettier (default config)
Server structure: models/, routes/, middleware/, server.js
Client structure: src/components/, src/pages/, src/context/, src/hooks/, src/i18n/
Prices always in cents (Stripe convention)
One task = one commit. Short commit messages in English (convention: feat:, fix:, chore:)


Behavior rules


Implement only the current task, do not anticipate future features
Do not refactor existing code unless explicitly asked
Every protected endpoint goes through the authorization middleware — never duplicate auth logic inline
password and address must never leave the API except through the routes defined in SPEC.md
No fake data in production code: seeding lives only in server/seed.js


Out of scope (do NOT implement)


Internal chat/messaging
Email notifications
Image upload (external image URLs are used)
Geolocation/maps (filtering is by city as a string)
Machine translation of user-generated content
Seasonal Challenges with voting and leaderboards → v2, only after the MVP is complete and deployed


Design system — "Quaderno di Nonna"

/* Fonts loaded via Google Fonts <link> in index.html:
   Caveat 600;700 + Lora 400;500;600 (Task 32) */

@theme {
  /* colors */
  --color-background: #FBF6EC;      /* pagina, carta da quaderno */
  --color-surface: #FDFBF6;         /* card, riquadri */
  --color-border: #C1602E;          /* bordo tratteggiato, tratti a mano */
  --color-text-primary: #3B2A1E;    /* titoli, corpo */
  --color-text-secondary: #8A6F4F;  /* metadati, sottotitoli */
  --color-accent: #8A2F12;          /* CTA, logo, enfasi */
  --color-accent-soft: #F3E3D8;     /* hover/sfondi di enfasi (mattone su crema) */
  --color-success: #6B7C4A;         /* stato positivo: posti, conferme, paid */

  /* type */
  --font-display: "Caveat", cursive;  /* 600/700 */
  --font-body: "Lora", serif;         /* 400/500/600 */

  /* spacing */
  --spacing-card: 14px;
  --spacing-section-y: 26px;
  --spacing-section-x: 30px;
  --spacing-gap: 22px;

  /* radius */
  --radius-card: 2px;    /* quasi squadrato, effetto foglio */
  --radius-pill: 20px;   /* badge, tag */

  /* shadow */
  --shadow-card: 3px 3px 0 rgba(59,42,30,.08); /* carta appoggiata */
}

Usage guidance:
- --font-display (Caveat) ONLY for: logo/wordmark, page titles, the
  verified-nonna badge. NEVER on CTAs, prices, form labels, or body —
  those use --font-body (Lora 600 for CTAs/prices): trust > charm on
  anything involving money or input.
- --color-accent for primary CTAs and key emphasis; --color-accent-soft
  for hovers and highlighted backgrounds; --color-success only for
  positive states (seats left, confirmed, paid).
- Cards: surface background, dashed/hand-drawn border (--color-border),
  --radius-card, --shadow-card. Badges/tags: --radius-pill.
- No color or font anywhere in the code outside these tokens.
- Reference mockups live in design/mockups/.
