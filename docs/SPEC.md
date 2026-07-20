Nonna's Kitchen — SPEC.md (source of truth)


This file defines the data model, the APIs and the client pages.
Any deviation must be agreed upon first and recorded here.



1. Key concepts


User: anyone who registers. Can act as a guest (books experiences) and/or a manager (manages one or more HostProfiles). There is no global role field: the role is contextual.
HostProfile: the public profile of the grandmother/grandfather. Not a User — has no login. Managed by one or more Users through the managers array.
Experience: a culinary event published by a HostProfile (date, seats, price).
Booking: a guest's reservation for an Experience. The experience address is visible only once the booking is confirmed and paid.
Review: post-experience review, bidirectional — one guest→host review and one host→guest review per booking (Task 41).


User ──manages──▶ HostProfile ──offers──▶ Experience ──receives──▶ Booking ──generates──▶ Review

2. Data model (Mongoose)

User

FieldTypeConstraintsnameStringrequired, trimemailStringrequired, unique, lowercasepasswordStringrequired, min 8 chars, select: false (bcrypt hash)avatarStringoptional (URL)interests{ city: String, maxPrice: Number (cents), tags: [String] }all optional — powers personalization (Task 37)ratingAvgNumberdefault 0, denormalized average of the hostToGuest reviews received as a guest, recomputed on every new hostToGuest review, same pattern as HostProfile.ratingAvg — supersedes Task 41's on-demand/no-denormalization choice (Task 42-bis)ratingCountNumberdefault 0, denormalized count of the same (Task 42-bis)timestampscreatedAt, updatedAt

HostProfile

FieldTypeConstraintsdisplayNameStringrequired (e.g. "Nonna Carmela")bioStringmax 1000cityStringrequired, indexneighborhoodStringoptionalphotos[String]URLsmanagers[ObjectId → User]required, min 1verifiedBooleandefault false ("verified nonna" badge)ratingAvgNumberdefault 0, denormalized average of the host's guestToHost reviews, recomputed on every new guestToHost review (Task 41)ratingCountNumberdefault 0, denormalized count of the host's guestToHost reviews (Task 41)completedExperiencesNumberdefault 0

Experience

FieldTypeConstraintshostObjectId → HostProfilerequiredtitleStringrequiredrecipeNameStringrequiredstoryStringmax 2000 (the story behind the recipe)dateDaterequireddurationMinNumberdefault 180priceNumberrequired, in centsseatsTotalNumberrequired, min 1, max 12seatsBookedNumberdefault 0addressStringrequired, select: falsephotos[String]URLstags[String]e.g. "desserts", "easter", "neapolitan"dietaryOptions[String]optional, e.g. "vegetariano", "senza glutine"menu[String]optional, dishes servedlanguagesSpoken[String]optional, languages the nonna speaksconversationTopics[String]optional, topics guests might chat about at the tablehouseRulesStringmax 500, optionalstatusString enumdraft / published / completed / cancelled — default draft

Note: Task 42 — added 5 optional descriptive fields (dietaryOptions, menu, languagesSpoken, conversationTopics, houseRules) to Experience. Purely descriptive: no filtering, no search impact.

Booking

FieldTypeConstraintsexperienceObjectId → ExperiencerequiredguestObjectId → UserrequiredseatsNumberdefault 1, min 1messageStringrequired, max 500 (trust & safety)statusString enumpending / confirmed / cancelled / completed — default pendingpaidBooleandefault false (independent of status: acceptance and payment are separate facts)stripeSessionIdStringoptional

Unique compound index on { experience, guest } → prevents double bookings.

Review

FieldTypeConstraintsbookingObjectId → BookingrequireddirectionString enumguestToHost / hostToGuest, requiredauthorObjectId → UserrequiredtargetHostObjectId → HostProfilerequired iff direction=guestToHosttargetUserObjectId → Userrequired iff direction=hostToGuestratingNumberrequired, 0–5 (widened from the originally-planned 1–5 — Task 41)textStringmax 1000, optional

Unique compound index on { booking, direction } → one review per booking per direction (a booking can carry both a guestToHost and a hostToGuest review).

3. API — /api/v1

Auth

MethodRouteProtectionNotesPOST/auth/register—bcrypt 10 roundsPOST/auth/login—returns JWT (1h expiry)

Public

MethodRouteProtectionNotesGET/experiences—query params: city, tag, from (date), q (text search on title/recipeName), host (id, a specific host's experiences). Only status=published. Never address. Sorted by host rating desc, then date asc (Task 41, see Note below)GET/experiences/:id—without addressGET/hosts/:id—public profile, including denormalized ratingAvg/ratingCount and managers populated as { _id, name, avatar } only (never email) — powers the "Gestita da" line (Task 42-bis, previously stripped entirely)GET/hosts/:id/reviews—guestToHost reviews for a host + { avg, count } (denormalized from HostProfile.ratingAvg/ratingCount) — Task 41

Host management (middleware: JWT + user ∈ managers)

MethodRouteProtectionNotesPOST/hostsJWTcreator becomes first managerGET/hosts/mineJWThost profiles managed by the current userPATCH/hosts/:idmanagerPOST/experiencesmanagerhost must be managed by the userPATCH/experiences/:idmanagerDELETE/experiences/:idmanageronly if status=draft, otherwise → cancelledGET/hosts/:id/bookingsmanagerreceived bookings for one host; guest populated with name + avatar only. No longer rendered by the dashboard — the per-host inbox was replaced by the aggregated GET /bookings/received (below) in Task 39b. Endpoint and its smoke checks remain.GET/hosts/:id/experiencesmanagerall statuses, including drafts (every public GET filters status=published, so managers had no way to list their own drafts/cancelled experiences); includes address (the edit form needs it). Added in Task 26.

Booking (middleware: JWT)

MethodRouteProtectionNotesPOST/bookingsJWTchecks seatsBooked + seats <= seatsTotal; creates with status=pendingGET/bookings/meJWTthe user's bookings as guestGET/bookings/receivedJWTall bookings across every host the current user manages, any status, sorted newest first; guest populated with name + avatar only, experience populated with title + date and its nested host (displayName + photos) — guest email/password never leak, matching the populate-whitelist convention used elsewhere. Powers the "Ricevute" sub-tab on /dashboard (Task 39b, replaces the per-host inbox introduced in Task 39)PATCH/bookings/:idJWTconfirm → host manager only; cancel → owning guest onlyGET/bookings/:id/addressJWTreturns address only if requester = booking guest and status=confirmed and paid=truePOST/bookings/:id/reviewJWTbody { rating, text }; direction inferred server-side from who the requester is relative to the booking (booking guest → guestToHost, any manager of the experience's host → hostToGuest); neither → 403; not eligible (see Note below) → 409; already reviewed in that direction → 409

Payments (middleware: JWT)

MethodRouteProtectionNotesPOST/api/v1/payments/checkout-sessionJWTbooking must belong to requester as guest (403), status=confirmed and paid=false (409 otherwise); amount = experience.price * booking.seats computed server-side from the DB — the client only sends a bookingId, never an amount; creates a Stripe Checkout Session (mode=payment, currency=eur), stores session.id on booking.stripeSessionId, returns { url }POST/api/v1/payments/verifyJWTbooking must belong to requester as guest (403); sessionId must match booking.stripeSessionId (400 otherwise); retrieves the session from Stripe and sets paid=true only if payment_status === "paid" (409 otherwise) — the success redirect alone is never treated as proof of payment

Note: Stripe on Express, not a Vercel serverless function as originally planned in Phase 1 — the checkout amount must be read from the database at request time (experience.price * booking.seats), and only the Express server has DB access. Trusting a client-supplied amount would let any guest set their own price. Decided in Task 14.

Note: No Stripe webhooks in the MVP — /payments/verify polls Stripe synchronously (sessions.retrieve()) when the client returns from the hosted Checkout page after a manual "I've paid, verify" action. This is sufficient for a manually-tested demo but not production-grade: a guest who closes the tab before returning is never verified, and nothing re-checks payment status later. Webhooks (a signature-validated POST /api/v1/payments/webhook, stripe listen for local dev) are the production-grade approach, deferred to v2. Decided in Task 14. TEST MODE ONLY — never a live secret key in this repo.

Note: Experience has no city field of its own — city lives on HostProfile. The city filter on GET /experiences resolves in two steps: first find matching HostProfile ids by city, then query Experience with host: { $in: ids }. Decided in Task 5.

Note: PATCH /bookings/:id transitions — pending → confirmed (host manager only); pending → cancelled (guest withdrawing, or host manager declining); confirmed → cancelled (guest only — a manager cannot cancel an already-confirmed booking in the MVP). Any other status change is rejected (400 invalid transition); a valid transition attempted by the wrong actor is rejected (403). Cancelling releases the booked seats (experience.seatsBooked -= booking.seats). Decided in Task 12.

Note: Review eligibility is a recorded SPEC deviation from the original one-directional design — Booking.status never actually reaches "completed" in this codebase (no code path sets it), so eligibility is instead booking.status === "confirmed" && booking.paid === true && experience.date < now. Decided in Task 41.

Note: GET /experiences' default sort changed from date asc to host rating desc, then date asc (ranking prioritization). Hosts with no reviews (ratingAvg default 0) sort after any rated host, using ratingCount as a secondary tie-break so a never-reviewed host never outranks a genuinely low-but-reviewed one. Decided in Task 41.

Note: Task 41 seed data uses Experience.status = "completed" (previously a dead enum value, never set by any code path) for a small number of past experiences, so they're excluded from the public catalog/host-page listings (both filter status=published) while still backing confirmed+paid past bookings for the review demo.

User (middleware: JWT)

MethodRouteProtectionNotesGET/users/meJWTcurrent user, never the passwordPATCH/users/meJWTupdates name, avatar, interests only (whitelist — email/password are never read from the body); maxPrice must be >= 0 (400 otherwise)GET/users/me/reviewsJWThostToGuest reviews received by the current user as a guest ("guest reputation"), + { avg, count } read from the denormalized User.ratingAvg/ratingCount (Task 42-bis, supersedes Task 41's on-demand aggregate)GET/users/:idJWTpublic-reputation subset only — name, avatar, createdAt, ratingAvg, ratingCount; never email, interests, or password (Task 42-bis)GET/users/:id/reviewsJWThostToGuest reviews received by that user (author name/avatar, rating, text, date) + { avg, count } from the same denormalized fields (Task 42-bis)

Note: PATCH /users/me whitelists its updatable fields by destructuring only { name, avatar, interests } from the body — email and password changes are impossible by construction, not by validation. Decided in Task 37.

Note: Task 41 deliberately left guest-reputation avg/count non-denormalized (computed on demand via aggregate in GET /users/me/reviews), reasoning that nothing ranked/sorted by it, unlike HostProfile.ratingAvg. Task 42-bis introduces a public guest-reputation page (GET /users/:id, GET /users/:id/reviews) needing this same number in more places, so User now carries ratingAvg/ratingCount denormalized via Review.recomputeGuestRating (same full-recompute-on-write pattern as Review.recomputeHostRating, called from POST /bookings/:id/review's hostToGuest branch), and GET /users/me/reviews was updated to read the stored fields instead of live-aggregating. Decided in Task 42-bis.

Cross-cutting rules


Three-level authorization middleware: (1) authenticated, (2) manager of that HostProfile, (3) guest of that Booking
Errors: JSON { error: string } with proper status codes (400/401/403/404/409)
409 Conflict for: sold-out seats, double booking


4. Client — pages (React Router 7)

RouteProtectedContent/—Landing + featured experiences/experiences—List with city/tag/date filters (synced with query params)/experiences/:id—Detail + book CTA (if not logged in → redirect to login)/hosts/:id—Nonna's public page: bio, story, reviews, badge, "Gestita da" line linking each manager to their /users/:id (Task 42-bis)/login, /register—/dashboard✅Tabbed double view: "My bookings" (two secondary sub-tabs — "Fatte"/Made: bookings made as guest, unchanged; "Ricevute"/Received, default off: aggregated booking requests across every host the user manages, any status, each card labeled with its nonna and linking to her manage page, accept/decline inline — Task 39b) / "My profiles" (hub: personal-profile card + managed nonna cards linking to their manage pages). Restructured in Task 39, sub-tabs added in Task 39b, supersedes the Task 35 layout/dashboard/hosts/:id✅Manage one nonna: her header, her experiences (all statuses), add experience — moved here from the "My profiles" tab (Task 39). The booking-requests inbox that used to live here moved to the aggregated "Ricevute" sub-tab on /dashboard (Task 39b) so a manager of multiple nonnas has one place to review requests. Manager-only: non-managers see a not-found state, and the underlying API calls are 403 anyway/hosts/new✅"Bring your nonna online" wizard/hosts/:id/experiences/new✅Add an experience to one of my host profiles (reached from /dashboard/hosts/:id, which is also the post-submit redirect target — Task 39)/profile✅Personal profile: avatar, name, email (read-only) + edit form for name, avatar URL, interests (reached from the navbar greeting). Added in Task 37/users/:id✅Public-reputation page for a guest: avatar, name, "guest since <year>", rating stars + count, review list (empty state if none). Reached from the requester name on "Ricevute" cards and from reviewer names on the host page; works identically if :id is the logged-in user's own id (no redirect). Added in Task 42-bis

State & patterns


AuthContext: current user + token persisted in sessionStorage (not localStorage), attached to fetches. Rehydrated synchronously on mount so a same-tab redirect (e.g. returning from Stripe Checkout) keeps the session; closing the tab still clears it. The JWT itself still expires after 1h server-side regardless of what's in storage. Language choice is unaffected and stays in-memory only (LanguageContext, untouched). Revises Task 7's in-memory-only decision ("simplicity over persistence for the MVP") — decided in Task 27, after the Stripe redirect was found to force an unnecessary re-login.
LanguageContext + useTranslation() hook: i18n (see section 5)
Custom hook useFetch(url): loading / error / data handling
useMemo for client-side filtering of the experience list
Protected routes: <RequireAuth> component with redirect to /login


5. Internationalization (i18n)


Languages: English (default) and Italian
Implementation: LanguageContext providing { lang, setLang, t }; t(key) reads from JSON dictionaries in client/src/i18n/en.json and client/src/i18n/it.json (flat keys, e.g. "nav.experiences", "booking.confirm")
Initial detection: navigator.language — it-* → Italian, anything else → English
Manual switcher in the navbar (EN | IT); choice persists for the session (in-memory state, no localStorage)
Scope: UI strings only. User-generated content (titles, stories, bios, reviews) is displayed as written — no machine translation
Dates and prices formatted with Intl.DateTimeFormat / Intl.NumberFormat according to the active language


6. Development phases

PhaseContentDemo-able result1Monorepo scaffolding, i18n foundation (LanguageContext + dictionaries + switcher), auth (register/login/JWT), User+HostProfile+Experience models, host/experience CRUD, public list with filtersBrowsable catalog with seed data, bilingual UI2Full booking flow, Stripe checkout, address-after-confirmation logicThe core: book, pay, receive the address3Reviews, verified badge (auto at N completed experiences), tabbed dashboardPolished productv2 (post-MVP)Seasonal Challenges: voting, leaderboard (e.g. "Pastiera Challenge")Only once MVP is deployed

Note: i18n is in Phase 1 on purpose — retrofitting translations onto hardcoded strings is far more painful than starting with the hook from the first component.

7. Seed

server/seed.js: 4–5 credible HostProfiles (Rome and Naples), 8–10 published Experiences with future dates, 2 demo users (one manager, one guest). Experience content written in Italian with English titles where natural (authenticity is part of the product). Runnable with node seed.js, idempotent (clears and repopulates).

8. Deploy


Express server → Render (env vars: MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY, CLIENT_URL)
Client → Vercel
.env in .gitignore, .env.example committed

Note: Render and Vercel are different origins — the Express server enables CORS restricted to CLIENT_URL (the deployed Vercel domain). Decided in Task 18.
