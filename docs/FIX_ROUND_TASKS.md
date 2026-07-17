# Nonna's Kitchen — Fix Round Task Prompts (post-UAT)

> Same workflow as always: one task at a time, **plan mode**, review the
> plan, approve, verify against the acceptance criteria, **npm run smoke**,
> commit, push, `/clear`, next.
>
> Source: docs/UAT_FINDINGS.md (triaged). This round covers FIX #1–#7
> (findings F9, F5, F10, F1, F11, F8, F13). DESIGN items (F2, F14) wait for
> the design phase; DEFER items (F3, F4, F15) wait for Phase 3/v2.
>
> Every task that changes UI strings must keep en.json/it.json in parity.
> Every SPEC-relevant change is recorded in SPEC.md in the same commit.

---

## Task 24 — Password minimum length (F9)

```
Read CLAUDE.md and docs/SPEC.md. Task: enforce a minimum password length.

- Server: POST /auth/register rejects passwords shorter than 8 characters
  with 400 { error } BEFORE hashing. Pick the validation spot consistent
  with the existing validation style in routes/auth.js.
- Client: /register form shows a translated inline error for short
  passwords (client-side check for UX + server remains the authority).
- Add the new error key to BOTH dictionaries.
- Record the rule in SPEC.md §2 (User.password: min 8 chars) in this
  commit.

Do NOT touch login, JWT logic, or other validation rules.

Acceptance criteria: register with a 3-char password → 400 from the API
and a translated message in the UI (EN and IT); register with 8+ works;
npm run smoke still passes.

After implementing, explain briefly where validation should live
(client vs server) and why the server must never trust the client.
```

## Task 25 — Host page reachable (F5)

```
Task: make the nonna's public page reachable. The route /hosts/:id and its
page may already exist (Task 9) — first VERIFY what works by opening it
with a seeded host id, then fix what's missing. Expected gaps:

- Experience detail page: the host's name/photo block must link to
  /hosts/:id.
- Catalog cards: the host name should link there too.
- If the /hosts/:id page itself is broken or incomplete (bio, photos,
  city, verified badge, her upcoming experiences via GET
  /experiences?host=:id), fix it to match SPEC §4.
- All new strings via t(), both dictionaries.

Do NOT build a host directory/index page (browse-all-hosts is a design
phase decision, not this task).

Acceptance criteria: from an experience detail I can click through to the
nonna's page and see her bio, photos and upcoming experiences; direct URL
+ hard refresh works on production (SPA rewrite); EN/IT parity; npm run
smoke passes.
```

## Task 26 — Edit/delete experiences from the dashboard (F10)

```
Task: expose the existing PATCH/DELETE experience APIs in the manager UI.

- In /dashboard "My profiles": under each managed host, list her
  experiences (title, date, status badge, seats booked/total) with two
  actions per experience:
  - "Edit" → an edit form (reuse/adapt the creation form) that PATCHes
    the experience; editable fields per SPEC §2.
  - "Delete" → confirm dialog; calls DELETE. Show the outcome per the
    API's behavior: draft → removed from the list; published → status
    becomes cancelled (translated explanation in the dialog).
- Translated success/error states for both actions.
- All strings via t(), both dictionaries.

Do NOT change the server routes or the state machine. Do NOT redesign the
dashboard layout (design phase) — plain list is fine.

Acceptance criteria: full lifecycle from the UI — create, edit a field,
see it publicly updated, delete a draft (gone), delete a published one
(cancelled, disappears from catalog); a manager only sees/edits their own
hosts' experiences; EN/IT parity; npm run smoke passes.
```

## Task 27 — Persist auth across the Stripe redirect (F1)

```
Task: eliminate the re-login after returning from Stripe. This reopens a
recorded decision (SPEC §4 / Task 7: in-memory auth, "simplicity over
persistence") — update SPEC.md and CLAUDE.md in this commit with the new
decision and rationale.

- Persist { token, user } in sessionStorage on login/register; rehydrate
  AuthContext from sessionStorage on mount; clear it on logout.
- sessionStorage, NOT localStorage: survives the same-tab redirect to
  Stripe and back, dies with the tab — closest to the current security
  posture. Note the JWT still expires after 1h server-side regardless.
- /bookings/success: with rehydration in place the "log in to confirm"
  gate should now only appear when the session is genuinely absent/expired
  — keep that fallback path working.
- Language choice: OUT of scope (keep language in-memory; do not touch
  LanguageContext).

Do NOT switch to localStorage, cookies, or refresh tokens. Do NOT touch
server auth.

Acceptance criteria: login → request → accept (manager) → Pay now → 4242
→ return lands on the success page ALREADY authenticated → verify runs
without re-login → address revealed. Logout still clears everything; a
new tab requires login (sessionStorage is per-tab). npm run smoke passes.

After implementing, explain the sessionStorage vs localStorage vs
in-memory tradeoff (XSS surface, persistence scope) — likely exam
question.
```

## Task 28 — i18n audit: error mapping + dictionary parity (F11)

```
Task: close the translation gaps found in UAT (untranslated booking
errors in EN, missing keys). Audit, then fix.

1. Trace every user-visible error path: API error responses shown by the
   client (booking 409 duplicate, 403 own-host, 400 validation, payment
   errors, auth errors). Identify where the client shows the raw server
   `error` string instead of mapping it to a translation key.
2. Fix the pattern in ONE consistent way: map API errors (by status +
   context, or an error code) to i18n keys; never render the raw server
   string.
3. Dictionary parity sweep: script or systematic check that en.json and
   it.json have identical key sets; add every missing key in both.
4. Report in the commit message body the list of keys added.

Do NOT rewrite the i18n system, and do NOT translate user-generated
content (SPEC §5 stands).

Acceptance criteria: B5 (duplicate booking) and B11 (own-host) show
translated errors in BOTH languages on production flows; key sets are
identical; no component renders a raw server error string; npm run smoke
passes.
```

## Task 29 — Seats-left refresh after mutations (F8)

```
Task: the catalog/detail seats-left updates only after a manual reload.
Server data is correct (verified in UAT via API) — this is client state.

- After any mutation that changes seats (create booking request, withdraw,
  manager decline/accept where relevant), the affected view must show
  fresh numbers without a manual page reload. Choose the simplest
  consistent mechanism (re-fetch on action success, or a refetch()
  exposed by useFetch) — consistency over cleverness, per CLAUDE.md.
- Apply it to: experience detail (after a request), dashboard bookings
  (after withdraw), manager inbox (after accept/decline).

Do NOT introduce a state-management library or caching layer.

Acceptance criteria: book → seats-left visibly drops without reload;
withdraw → it rises back; decline (manager) → same; npm run smoke passes.

After implementing, explain briefly why the UI showed stale data (fetch
on mount only) and the chosen refresh strategy.
```

## Task 30 — Tag dropdown in the catalog filter (F13)

```
Task: replace the free-text tag filter with a select populated from the
tags that actually exist on published experiences.

- Client-side is fine for the MVP: derive the unique sorted tag list from
  the already-fetched experiences (useMemo); no new API endpoint.
- The select stays synced with the URL query param like the current text
  input (useSearchParams) — a shared link with ?tag=... must preselect.
- Include an "all tags" empty option (translated).
- Note the limitation in the code (list derives from the current page's
  data — fine while the catalog is unpaginated) — no SPEC change needed.

Do NOT add a tags endpoint, and do NOT touch how tags are SET on
experiences (creation form free text stays; cleaning dirty tags like
"èasta" is seed/data work, not this task).

Acceptance criteria: the dropdown lists real tags only; selecting filters
correctly and updates the URL; visiting a link with ?tag= preselects;
EN/IT parity for the new labels; npm run smoke passes.
```

## Task 31 — Fix round review

```
Task: verification pass, no new features — same format as Tasks 10/17/23.

1. docs/UAT_FINDINGS.md FIX items #1–#7 vs code: confirm each finding is
   actually resolved, on production behavior where applicable.
2. CLAUDE.md/SPEC.md: the two reopened decisions (password min length,
   sessionStorage auth) are recorded; dictionaries in parity.
3. Run npm run smoke (local) and SMOKE_URL=<render-url> npm run smoke
   (production, after deploy) — include results.
4. Report: fixed / still open / new tech debt. Persist as an update to
   docs/UAT_FINDINGS.md (mark triage column: done) + a short
   docs/FIX_ROUND_REVIEW.md. Do NOT fix anything new — report first.
```

---

## Rules of engagement (unchanged)

1. One task → plan → review → approve → verify with YOUR hands →
   npm run smoke → commit → push
2. Reject any plan that exceeds the task's scope
3. Decisions live in SPEC.md/CLAUDE.md, not in the chat
4. Deploys: pushing to main auto-deploys Vercel; Render redeploys on push
   too — verify each fix ON PRODUCTION once merged (cold start caveat)
```
