Nonna's Kitchen — Phase 1 Task Prompts (Claude Code)


How to use: one task at a time, in order. Start each task in plan mode (/plan or Shift+Tab),
review the plan, approve, verify the result, commit, move on.
If the plan includes anything outside the task scope, reject it and ask to re-plan.




Task 0 — Kickoff & scaffolding

Read CLAUDE.md and docs/SPEC.md carefully. They are the source of truth for this project.

Task: scaffold the monorepo. Root with server/ and client/ directories.
- server/: npm init, Express 5, pure ESM ("type": "module"), a minimal server.js listening on port 8080 with a GET /api/v1/health route returning { status: "ok" }. Install nodemon as dev dependency with a "dev" script.
- client/: Vite + React 19 + Tailwind CSS 4 + React Router DOM 7. Configure the Vite dev proxy: /api/* → http://localhost:8080.
- Root: .gitignore (node_modules, .env, dist), .env.example in server/ with the variables listed in SPEC.md section 8, Prettier default config.

Do NOT create any models, routes (besides /health), pages or components yet.

Acceptance criteria: `npm run dev` in server/ responds on /api/v1/health; `npm run dev` in client/ shows the Vite default page; fetch("/api/v1/health") from the client returns ok through the proxy.


Task 1 — i18n foundation

Task: implement the i18n foundation exactly as defined in SPEC.md section 5.

- client/src/i18n/en.json and it.json with an initial minimal set of keys (nav.*, common.*)
- LanguageContext providing { lang, setLang, t }
- useTranslation() custom hook
- Initial detection from navigator.language (it-* → "it", otherwise "en")
- A basic Navbar component with the EN | IT switcher, using t() for all its strings
- Wrap the app in the provider

Do NOT add other pages or components. Do NOT use localStorage.

Acceptance criteria: the navbar renders, switching EN/IT changes its strings live, browser set to Italian starts in Italian.

After implementing, explain briefly how the Context + hook pattern works, as if to a student.


Task 2 — DB connection, User model, auth routes

Task: database connection and authentication, server side only.

- Mongoose 9 connection to MongoDB Atlas using MONGODB_URI from .env (dotenv), with a clear error message if missing
- User model exactly as in SPEC.md section 2 (respect select: false on password)
- POST /api/v1/auth/register: validates input, hashes password with bcrypt (10 rounds), returns the created user WITHOUT password
- POST /api/v1/auth/login: verifies credentials, returns { token, user } with a JWT signed with JWT_SECRET, 1h expiry
- helmet enabled on the app
- Errors as JSON { error } with proper status codes (400 validation, 401 wrong credentials, 409 duplicate email)

Do NOT create the auth middleware yet. Do NOT touch the client.

Acceptance criteria: I can register and log in via REST client; duplicate email returns 409; the password hash never appears in any response.

After implementing, explain the register/login flow and why the password uses select: false.


Task 3 — Auth middleware + HostProfile

Task: authorization middleware and host profiles.

- middleware/auth.js: requireAuth — verifies the Bearer token, attaches req.user (id), 401 if missing/invalid/expired
- HostProfile model exactly as in SPEC.md section 2
- POST /api/v1/hosts (requireAuth): creates a profile, the creator becomes the first manager
- PATCH /api/v1/hosts/:id (requireAuth): allowed only if req.user is in the managers array, otherwise 403
- GET /api/v1/hosts/:id (public): profile without sensitive data

Implement the "is manager of this host" check as a reusable middleware or helper — it will be needed for experiences too.

Do NOT create the Experience model yet.

Acceptance criteria: creating a host works with a valid token and fails with 401 without; PATCH from a non-manager user returns 403.

After implementing, explain the three-level authorization design from SPEC.md section 3.


Task 4 — Experience model + management CRUD

Task: experiences, management side.

- Experience model exactly as in SPEC.md section 2 (respect select: false on address, price in cents, status enum with default "draft")
- POST /api/v1/experiences (manager only): the host field must reference a HostProfile managed by req.user, otherwise 403
- PATCH /api/v1/experiences/:id (manager of that experience's host only)
- DELETE /api/v1/experiences/:id (manager only): hard delete only if status=draft; otherwise set status=cancelled and return it
- GET /api/v1/hosts/:id/bookings can wait (Phase 2) — do NOT create it

Acceptance criteria: full lifecycle draft → published via PATCH works; a manager of host A cannot create/edit experiences for host B (403); DELETE on a published experience cancels instead of deleting.

After implementing, explain the draft/published/cancelled status design and why we avoid hard deletes.


Task 5 — Public experience routes

Task: public catalog, server side.

- GET /api/v1/experiences: only status=published, never the address field. Query params as per SPEC.md: city (exact match, case-insensitive), tag (in tags array), from (date >= from), q (case-insensitive text search on title and recipeName). Params are combinable. Sort by date ascending.
- GET /api/v1/experiences/:id: single experience without address, with host populated (displayName, city, verified, photos)

Acceptance criteria: /experiences?city=rome&tag=desserts&q=pastiera filters correctly; draft experiences never appear; address never appears in any public response.

After implementing, explain how the Mongoose query is built from optional query params.


Task 6 — Seed script

Task: server/seed.js as per SPEC.md section 6.

- 4-5 HostProfiles (Rome and Naples) with credible Italian names, bios and stories; photos as placeholder URLs (e.g. Unsplash food/kitchen images)
- 8-10 published Experiences with future dates, realistic prices in cents, varied tags
- 2 demo users: manager@demo.com (manages two profiles) and guest@demo.com, password "password123" for both
- Idempotent: clears the collections and repopulates
- Run with: node seed.js

Acceptance criteria: after seeding, GET /api/v1/experiences returns the experiences; logging in as manager@demo.com works.


Task 7 — Client auth

Task: authentication on the client.

- AuthContext: holds { user, token }, exposes login(), register(), logout(); attaches the token to authenticated fetches
- /login and /register pages with forms (controlled components), error states shown to the user, all strings via t()
- RequireAuth wrapper component: redirects to /login if not authenticated
- Navbar updates: shows login/register links or user name + logout

Do NOT build the dashboard yet.

Acceptance criteria: register → login → navbar shows my name → refresh keeps me on the page (token in memory is acceptable per SPEC) → logout works. UI fully bilingual.

After implementing, explain how AuthContext and RequireAuth work together with React Router.


Task 8 — Catalog pages

Task: public catalog on the client.

- useFetch(url) custom hook with { data, loading, error } as per SPEC.md
- /experiences page: fetches from the API, renders cards (photo, title, recipeName, host name, city, date, price formatted with Intl.NumberFormat as EUR, seats left). Filters for city, tag and date synced with URL query params (useSearchParams). useMemo where appropriate.
- /experiences/:id page: full detail with the host's story, "Book" CTA → if not logged in, redirect to /login (booking flow itself is Phase 2 — the button can be a placeholder)
- / landing: hero + 3 featured experiences (nearest dates), links to the catalog

All strings via t(). Dates via Intl.DateTimeFormat according to active language.

Acceptance criteria: catalog browsable with working filters reflected in the URL; loading and error states visible; switching language changes UI strings and date/price formats.


Task 9 — Host pages

Task: host-side client pages.

- /hosts/:id public page: nonna's profile (photos, bio, city, verified badge), her upcoming experiences
- /hosts/new (protected): "Bring your nonna online" wizard — a simple multi-step form (profile info → first experience optional) that calls POST /hosts and optionally POST /experiences
- /dashboard (protected) skeleton with two tabs: "My bookings" (empty state for now, Phase 2) and "My profiles" (lists HostProfiles where I am a manager, links to create experiences)

Acceptance criteria: I can create a host profile and its first experience entirely from the UI, and see it appear in the public catalog.


Task 10 — Phase 1 review

Task: verification pass, no new features.

1. Run through SPEC.md sections 2, 3 (Phase 1 routes only), 4 and 5 and list any deviation between spec and code
2. Check the CLAUDE.md behavior rules: no hardcoded UI strings, no password/address leaks, auth logic only in middleware
3. Check that error handling is consistent ({ error } + correct status codes)
4. Produce a short report: what is done, what deviates, what is technical debt

Do NOT fix anything yet — report first, we decide together what to fix.


Rules of engagement (reminder to self)


1. One task → plan → review plan → approve → verify → commit → next
2. If Claude Code proposes anything beyond the task, reject and re-scope
3. If something is unclear in the generated code, ask "why did you use X here?" before committing
4. Update SPEC.md if we agree on a deviation — the file is the truth, not the chat
