# Nonna's Kitchen — UAT Findings

> One entry per finding. Severity: **S1** blocks the demo · **S2** hurts the
> experience/credibility · **S3** cosmetic/nice-to-have. Type: bug /
> UX / feature / design-debt. Triage decisions (fix now / defer / won't fix)
> are made together AFTER the full UAT pass — do not start fixing while
> testing.

| ID | Severity | Type | Finding | Notes / repro | Triage |
|----|----------|------|---------|---------------|--------|
| F1 | S2 | UX | Re-login required after returning from Stripe checkout, right after the user paid — worst possible moment for friction | Known cause: in-memory auth (SPEC §4, Task 7 decision "simplicity over persistence"). Fix = persist token (sessionStorage) + rehydrate AuthContext on mount; reopens a recorded SPEC decision, must be updated there | pending |
| F2 | S2 | UX | "My profiles" tab shown to every user, empty and unexplained for pure guests — feels broken/scarce | Design decision to defend: no global role (SPEC §1, contextual roles) is intentional — any guest can become a nipote. Candidate fix is NOT rigid roles but a proper empty state with CTA to the "bring your nonna online" wizard | pending |
| F3 | S3 | feature | No personal profile page: user cannot change avatar or profile info | `avatar` field already exists on the User model; needs UI page + PATCH /users/me route. Small, self-contained | pending |
| F4 | S3 | feature | Experience detail page too thin: title + story not enough to feel the product | Scope agreed: descriptive fields only, NO filtering. Shortlist to confirm (6–8 of): dietaryOptions, menu, languagesSpoken, conversationTopics, recipeOrigin, houseRules, whatToBring, takeHome. Requires SPEC §2 update first, then model + wizard form + detail page + seed enrichment + EN/IT labels | pending |

<!-- Add new findings below as F5, F6, ... during the UAT pass -->
