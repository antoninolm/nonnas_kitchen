# Nonna's Kitchen — Phase 3 Task Prompts (profile, dashboard IA, reviews)

> Same workflow: one task at a time, plan mode → review → approve → verify
> → npm run smoke → commit → push → check production. Numbering continues
> from Task 36. Deadline-driven: the app must be demo-ready in ONE WEEK.
>
> **Scope decisions (already made):**
> - Chat/messaging: CUT (stays out of scope per CLAUDE.md; roadmap item).
> - Experience extra fields: LIMITED TO 5 — dietaryOptions, menu,
>   languagesSpoken, conversationTopics, houseRules.
> - Reviews: bidirectional (guest→host AND host→guest), rating 0–5 + text.
>   Review eligibility: booking confirmed && paid && experience date past
>   (the status machine never reaches "completed" — recorded deviation).
>
> **Order matters**: 37 unblocks 38/39/40. Do not reorder.
>
> **Every task**: EN/IT parity for new strings; SPEC.md updated in the
> same commit for any model/route change; smoke suite extended when new
> server routes land (companion checks, same style).

---

## Task 37 — User profile + interests (foundations)

```
Read CLAUDE.md and docs/SPEC.md. Task: personal profile page + the data
that powers personalization.

Server:
- Extend the User model (SPEC §2 update in this commit): avatar already
  exists; add interests: { city: String, maxPrice: Number (cents),
  tags: [String] } — all optional.
- GET /api/v1/users/me (requireAuth): current user without password.
- PATCH /api/v1/users/me (requireAuth): updates name, avatar, interests.
  Never email/password (out of scope). Validate maxPrice >= 0.
- Extend smoke test: /users/me GET+PATCH round-trip, password never in
  response, unauthenticated 401. Update the check count note.

Client:
- /profile page (protected): shows avatar (or placeholder initial),
  name, email (read-only), and an edit form: name, avatar URL, interests
  (city text, budget number in EUR converted to cents, tags free text
  comma-separated). Styled with the design system (.field, paper card).
- Navbar: "Ciao, {name}" becomes a Link to /profile (request #5).
- All strings via t(), both dictionaries.

Do NOT touch reviews, dashboard structure, or experience model yet.

Acceptance criteria: I can open /profile from the navbar greeting, set
avatar + interests, refresh (re-login if needed) and see them persisted;
password never appears in any response; smoke passes with the new checks.
```

## Task 38 — Small batch: logo, copy, nav, backlog micro-fixes

```
Task: five small independent UI items, one commit each, no server changes.

a) Logo next to the wordmark in the navbar (request #1): a small inline
   SVG or emoji-free glyph consistent with the design system (e.g. a
   simple hand-drawn-style pot/spoon mark in --color-accent). Keep the
   Caveat wordmark. No external image files.
b) Login page copy (request #3): add the tagline "Vieni a mangiare da
   nonna, che sei sciupato!" as the login subtitle (replaces or joins
   the current one — keep it warm). EN version in the same spirit
   ("Come eat at nonna's — you look too thin!"). Both dictionaries.
c) Navbar: center the main nav links (Esperienze, Dashboard) between the
   logo (left) and the account area (right) (request #4). Keep the
   375px wrap behavior working.
d) F18: proper singular/plural for seats ("1 posto" / "2 posti", "1
   seat" / "2 seats") wherever counts render — add the singular keys,
   pick by count === 1 (no i18n library).
e) F19 + F20: hide the paid/unpaid indicator on cancelled bookings; give
   /bookings/success its paper-card styling.

Acceptance criteria: each item verified in browser EN+IT at desktop and
375px; five commits; smoke passes (nothing server-side changed).
```

## Task 39 — Dashboard restructure (requests #6 + #7)

```
Task: information architecture of the dashboard. This SUPERSEDES parts of
the Task 35 layout — record the new structure in SPEC §4.

- "Le mie prenotazioni" tab: ONLY bookings I made as a guest (as today,
  BookingCard unchanged). The received-requests inbox MOVES OUT of this
  area entirely (request #7 — no mixing made/received).
- "I miei profili" tab becomes a hub:
  - A "personal profile" card at top: avatar, name, link to /profile.
  - The list of managed nonnas as cards (photo, name, city, verified
    badge). Clicking a nonna navigates to a NEW page
    /dashboard/hosts/:id (protected, manager-only).
- New page /dashboard/hosts/:id: the nonna's management page — her
  header, her experiences list (Task 26 component, moved here), and her
  received booking requests inbox (Task 35 cards component, moved here,
  now showing the requester's AVATAR from Task 37 when present,
  placeholder initial otherwise). "Add experience" lives here.
- Reuse the existing components (HostExperienceList,
  HostBookingRequests) — move, don't rewrite; pass avatar data through
  (server: GET /hosts/:id/bookings must populate guest avatar — small
  server change, update SPEC §3 note + smoke if response shape changes).
- All strings via t(); empty states styled per the design system.

Do NOT add inbox filtering (still deferred). Do NOT touch the booking
state machine.

Acceptance criteria: a manager lands on profiles hub → clicks a nonna →
manages her experiences and requests on her page, requester avatars
visible; a pure guest sees personal profile card + F2 empty invitation;
"Le mie prenotazioni" shows only made bookings; deep link + hard refresh
works on the new route in production; EN/IT parity; smoke passes.
```

## Task 40 — Personalized featured (request #2)

```
Task: the landing/dashboard highlights experiences matching the user's
interests (from Task 37). Client-side only.

- On the landing (and optionally a small strip atop the dashboard): if
  logged in AND interests set, the featured section becomes "In evidenza
  per te": rank the already-fetched published experiences by simple
  match score (host city == interests.city; price <= maxPrice; tag
  overlap) — useMemo, no new endpoint, no server changes.
- Fallback: not logged in or no interests → current behavior (nearest
  dates) with the current title.
- Translated section title + a small hint linking to /profile to set
  interests ("personalizza i tuoi interessi").

Do NOT build a recommendation endpoint. Do NOT change the catalog page.

Acceptance criteria: with interests set (e.g. city Rome, budget 60€,
tag pasta) the featured strip reorders visibly and shows the
personalized title; without interests, unchanged; EN/IT; smoke passes.
```

## Task 41 — Bidirectional reviews + ranking (request #8)

```
Task: reviews both ways + host ranking. The biggest task — SPEC §2/§3
updates in the same commit.

Model (extends the existing planned Review):
- Review: booking (ref, required), direction: "guestToHost" |
  "hostToGuest", author (User), targetHost (HostProfile, when
  guestToHost), targetUser (User, when hostToGuest), rating Number 0–5
  required, text String max 1000 optional.
- Unique compound index { booking, direction } — one review per booking
  per direction.

Eligibility (recorded SPEC deviation — status never reaches
"completed"): reviewable iff booking.status === "confirmed" &&
booking.paid === true && experience.date < now. Guest reviews the host;
any manager of the host reviews the guest.

Server:
- POST /api/v1/bookings/:id/review (requireAuth): body { rating, text };
  direction inferred from who the requester is (guest → guestToHost;
  host manager → hostToGuest); 403 otherwise; 409 if not eligible or
  already reviewed in that direction.
- GET /api/v1/hosts/:id/reviews (public): guestToHost reviews + avg.
- GET /api/v1/users/me/reviews (requireAuth): hostToGuest reviews
  received by me + avg (my "guest reputation").
- GET /api/v1/experiences: add avgRating to each item's host (aggregate
  or denormalized ratingAvg/ratingCount on HostProfile updated on review
  creation — prefer denormalized: simpler, recorded in SPEC).
- Sort: catalog default order becomes host rating desc, then date asc
  (ranking prioritization). Recorded in SPEC §3.
- Extend smoke: eligibility guards (pending 409, not-participant 403,
  double review 409), rating bounds, avg math on the seeded data.

Client:
- On a paid+past booking (guest side, BookingCard): "Lascia una
  recensione" → inline rating (5 clickable stars/values) + text →
  submit.
- Same on the manager's request cards for the guest (hostToGuest).
- Host public page: avg rating + review list (author name, rating,
  text, date).
- /profile: "Le tue recensioni" section — reviews received as a guest.
- Card + detail: show the host's avg rating (e.g. ★ 4.8) near the name.
- Seed: add a few completed-in-the-past bookings + reviews so ranking
  is visible in the demo.
- All strings via t().

Acceptance criteria: full loop on production — past paid booking →
guest reviews nonna → her avg appears on card/detail/host page and
catalog reorders; nonna's manager reviews the guest → visible on the
guest's /profile; ineligible bookings show no review UI; smoke passes
with the new checks.
```

## Task 42 — Experience extra fields, reduced (F4: 5 fields)

```
Task: enrich the experience with 5 descriptive fields. SPEC §2 update in
the same commit. NO filtering on these fields.

- Experience model: dietaryOptions [String], menu [String],
  languagesSpoken [String], conversationTopics [String], houseRules
  String max 500 — all optional.
- ExperienceFields form: inputs for the five (comma-separated for the
  arrays, textarea for houseRules), so create/edit/wizard all get them.
- Detail page: render them in the design system — pills for
  dietaryOptions/languages, a "Menu" list, a warm "A tavola si parla
  di..." block for conversationTopics, houseRules as a bordered note
  ("Le regole della casa").
- Seed: enrich the 9 seeded experiences with credible values (this is
  demo content — make it charming, Italian where natural).
- All labels via t(), both dictionaries.

Acceptance criteria: create/edit round-trips the five fields; detail
page shows them beautifully; seeded catalog demonstrates them; EN/IT;
smoke passes (public routes unchanged in shape except new optional
fields).
```

## Task 43 — Final review + production pass

```
Task: verification pass, no new features — same format as previous
reviews (10/17/23/31/36).

1. Requests #1–#8 vs delivered: item-by-item status (chat #9 cut by
   decision, recorded as roadmap).
2. SPEC.md vs code for every Phase 3 change (User.interests, Review,
   ranking sort, 5 experience fields, dashboard IA).
3. Full production demo run of the new loop: profile+interests →
   personalized featured → book → accept (avatar visible in inbox) →
   pay → address → review both directions → ranking visible.
4. Smoke local + read-only prod checks; EN/IT parity count; 375px pass
   on the new/changed pages (/profile, /dashboard/hosts/:id, detail
   with new fields).
5. Report: docs/PHASE3_REVIEW.md — done / deviations / tech debt /
   roadmap (chat, inbox filtering, webhooks, CI...). Do NOT fix.
```

---

## Pacing for the week

- Day 1: Task 37 (foundations) + Task 38 (small batch).
- Day 2: Task 39 (dashboard IA — the delicate one; plan reviewed
  externally before approving).
- Day 3: Task 40 (quick) + start Task 41.
- Day 4: finish Task 41 (reviews are the meat).
- Day 5: Task 42 + Task 43 review.
- Keep half a day of slack for production issues; verify Vercel actually
  deploys after each push (known skip issue).

## Rules of engagement (unchanged)

1. One task → plan → review → approve → verify → npm run smoke → commit
   → push → check production
2. Reject any plan that exceeds the task's scope
3. Decisions live in SPEC.md/CLAUDE.md — every model/route change updates
   SPEC in the same commit
4. Secrets never in chat. Stripe TEST MODE ONLY.
