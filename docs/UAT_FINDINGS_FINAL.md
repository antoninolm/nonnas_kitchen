# Nonna's Kitchen — UAT Findings (final, triaged)

> UAT pass completed on production (nonnas-kitchen.vercel.app), all 3
> personas + cross-cutting. Severity: **S1** blocks the demo · **S2** hurts
> experience/credibility · **S3** cosmetic/nice-to-have.
> Triage: **FIX** = fix round (ordered) · **DESIGN** = handled in the design
> phase · **DEFER** = post-MVP / time-permitting · **BY-DESIGN** = expected
> behavior, defend at the exam.

## Bugs

| ID  | Sev | Finding                                                                                                | Diagnosis / notes                                                                                                                                                                                                                                                                                                                     | Triage                  |
| --- | --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| F5  | S2  | Host public page not reachable: no link from experience detail, no way to browse hosts at all (A6, C8) | Route/page may exist but is orphaned — verify /hosts/:id by direct URL during fix. The nonna's page is the heart of the product                                                                                                                                                                                                       | FIX #2 — done (Task 25) |
| F9  | S2  | Registration accepts a 1-character password (B1)                                                       | Missing min-length validation server-side (and client). Basic security hygiene                                                                                                                                                                                                                                                        | FIX #1 — done (Task 24) |
| F10 | S2  | No UI to edit or delete experiences (C6, C7)                                                           | APIs exist since Task 4; "My profiles" never exposes them. Manager functionality is half-built                                                                                                                                                                                                                                        | FIX #3 — done (Task 26) |
| F11 | S2  | i18n gaps: booking errors untranslated in EN (B5 409, B11 403), other missing keys (B12, C9)           | One audit task: map every API error path + key-parity sweep of both dictionaries. **Review outcome:** the audit found dictionaries already at full parity and B5/B11 already mapped — fixed en route by Tasks 24–27; Task 28's delivered value was deduplicating the error→key mapping into `utils/apiError.js`                       | FIX #5 — done (Task 28) |
| F8  | S3  | Seats-left in the UI doesn't update right after book/withdraw/decline; correct after reload (B7, C5)   | DB verified correct via curl (smoke also covers it). Pure client refresh issue: re-fetch or local state update after mutations. **Review outcome:** 2 of the 3 named views were already correct; the real fix was sibling staleness — a manager decline left HostExperienceList's seats count stale (refreshKey remount in Dashboard) | FIX #6 — done (Task 29) |

## UX

| ID  | Sev | Finding                                                                                             | Diagnosis / notes                                                                                                                  | Triage                                                                                                                                                                                 |
| --- | --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | S2  | Re-login required right after paying on Stripe (B9)                                                 | Consequence of in-memory auth (SPEC §4, Task 7). Fix: persist token (sessionStorage) + rehydrate AuthContext; update SPEC decision | FIX #4 — done (Task 27)                                                                                                                                                                |
| F2  | S2  | "My profiles" tab empty and unexplained for pure guests                                             | Keep contextual-role model (defend at exam); fix with a proper empty state + CTA to the wizard                                     | DESIGN — done (Task 35, verified in docs/DESIGN_REVIEW.md)                                                                                                                             |
| F13 | S3  | Tag filter is free text — users must guess tags (A3); also causes dirty data (typo "èasta" in prod) | Dropdown populated from existing tags                                                                                              | FIX #7 — done (Task 30)                                                                                                                                                                |
| F14 | S3  | Manager requests inbox: wants cards filterable by date/nonna/seats, with requester photo (C4)       | Requester photo depends on F3 (user profile/avatar). Redesign of the inbox                                                         | DESIGN — reduced scope done (Task 35: inbox redesign, verified in docs/DESIGN_REVIEW.md); deferred parts (requester photo, date/nonna/seats filtering) depend on F3, Phase 3 candidate |

## Features

| ID  | Sev | Finding                                                            | Diagnosis / notes                                                                                                                                             | Triage                        |
| --- | --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| F3  | S3  | No personal profile page (avatar, info)                            | `avatar` exists on the User model; needs page + PATCH /users/me                                                                                               | DEFER (candidate for Phase 3) |
| F4  | S3  | Experience detail too thin — add descriptive fields (no filtering) | Shortlist agreed: dietaryOptions, menu, languagesSpoken, conversationTopics, recipeOrigin, houseRules, whatToBring, takeHome (pick 6–8). SPEC §2 update first | DEFER (candidate for Phase 3) |
| F15 | S3  | Photo upload from PC instead of URL (C2)                           | Explicitly out of scope in CLAUDE.md (no image upload); would require external storage (e.g. Cloudinary). URLs suffice for the exam demo                      | DEFER (v2)                    |

## By design / known tech debt (no action)

| ID  | Finding                                                                 | Why no action                                                                                                                           |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| F16 | User-generated content (stories, recipe names) not translated (A8, B12) | SPEC §5: UI strings only, no machine translation of UGC. Defend at exam. City names as filter labels: borderline, note for design phase |
| F17 | Slow first load (A9)                                                    | Render free-tier cold start (~50s), recorded tech debt. Mitigation for exam day: warm the API with a curl before presenting             |

## Design phase input (X3)

Everything is a skeleton; priority pages per the UAT: experience detail
(richer), "My profiles" (visual separators, hierarchy), user-facing empty
states. Full restyle happens in the dedicated design phase (Claude Design →
tokens in CLAUDE.md → restyling), which also absorbs F2 and F14.

---

## Fix round — agreed order

All seven items completed and verified — see docs/FIX_ROUND_REVIEW.md
(Task 31) for the evidence.

1. ✅ **F9** password min length (server + client validation) — Task 24
2. ✅ **F5** host page reachable: link from experience detail + fix/verify /hosts/:id — Task 25
3. ✅ **F10** edit/delete experiences from "My profiles" — Task 26
4. ✅ **F1** persist auth across the Stripe redirect (sessionStorage + SPEC update) — Task 27
5. ✅ **F11** i18n audit: error mapping + dictionary parity — Task 28 (mostly already fixed en route; see F11 row)
6. ✅ **F8** UI refresh of seats-left after mutations — Task 29
7. ✅ **F13** tag dropdown from existing tags — Task 30

F3/F4 reconsidered after the fix round against remaining time (Phase 3
candidates alongside reviews + verified badge).
