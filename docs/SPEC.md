Nonna's Kitchen — SPEC.md (source of truth)


This file defines the data model, the APIs and the client pages.
Any deviation must be agreed upon first and recorded here.



1. Key concepts


User: anyone who registers. Can act as a guest (books experiences) and/or a manager (manages one or more HostProfiles). There is no global role field: the role is contextual.
HostProfile: the public profile of the grandmother/grandfather. Not a User — has no login. Managed by one or more Users through the managers array.
Experience: a culinary event published by a HostProfile (date, seats, price).
Booking: a guest's reservation for an Experience. The experience address is visible only once the booking is confirmed and paid.
Review: post-experience review, one per booking.


User ──manages──▶ HostProfile ──offers──▶ Experience ──receives──▶ Booking ──generates──▶ Review

2. Data model (Mongoose)

User

FieldTypeConstraintsnameStringrequired, trimemailStringrequired, unique, lowercasepasswordStringrequired, select: false (bcrypt hash)avatarStringoptional (URL)timestampscreatedAt, updatedAt

HostProfile

FieldTypeConstraintsdisplayNameStringrequired (e.g. "Nonna Carmela")bioStringmax 1000cityStringrequired, indexneighborhoodStringoptionalphotos[String]URLsmanagers[ObjectId → User]required, min 1verifiedBooleandefault false ("verified nonna" badge)completedExperiencesNumberdefault 0

Experience

FieldTypeConstraintshostObjectId → HostProfilerequiredtitleStringrequiredrecipeNameStringrequiredstoryStringmax 2000 (the story behind the recipe)dateDaterequireddurationMinNumberdefault 180priceNumberrequired, in centsseatsTotalNumberrequired, min 1, max 12seatsBookedNumberdefault 0addressStringrequired, select: falsephotos[String]URLstags[String]e.g. "desserts", "easter", "neapolitan"statusString enumdraft / published / completed / cancelled — default draft

Booking

FieldTypeConstraintsexperienceObjectId → ExperiencerequiredguestObjectId → UserrequiredseatsNumberdefault 1, min 1messageStringrequired, max 500 (trust & safety)statusString enumpending / confirmed / cancelled / completed — default pendingpaidBooleandefault false (independent of status: acceptance and payment are separate facts)stripeSessionIdStringoptional

Unique compound index on { experience, guest } → prevents double bookings.

Review

FieldTypeConstraintsbookingObjectId → Bookingrequired, unique (one review per booking)hostObjectId → HostProfilerequired (denormalized for fast queries)authorObjectId → UserrequiredratingNumberrequired, 1–5textStringmax 1000

3. API — /api/v1

Auth

MethodRouteProtectionNotesPOST/auth/register—bcrypt 10 roundsPOST/auth/login—returns JWT (1h expiry)

Public

MethodRouteProtectionNotesGET/experiences—query params: city, tag, from (date), q (text search on title/recipeName), host (id, a specific host's experiences). Only status=published. Never addressGET/experiences/:id—without addressGET/hosts/:id—public profile + aggregated reviews

Host management (middleware: JWT + user ∈ managers)

MethodRouteProtectionNotesPOST/hostsJWTcreator becomes first managerGET/hosts/mineJWThost profiles managed by the current userPATCH/hosts/:idmanagerPOST/experiencesmanagerhost must be managed by the userPATCH/experiences/:idmanagerDELETE/experiences/:idmanageronly if status=draft, otherwise → cancelledGET/hosts/:id/bookingsmanagerreceived bookings

Booking (middleware: JWT)

MethodRouteProtectionNotesPOST/bookingsJWTchecks seatsBooked + seats <= seatsTotal; creates with status=pendingGET/bookings/meJWTthe user's bookings as guestPATCH/bookings/:idJWTconfirm → host manager only; cancel → owning guest onlyGET/bookings/:id/addressJWTreturns address only if requester = booking guest and status=confirmed and paid=truePOST/bookings/:id/reviewJWTbooking guest only, only if status=completed

Payments (middleware: JWT)

MethodRouteProtectionNotesPOST/api/v1/payments/checkout-sessionJWTbooking must belong to requester as guest (403), status=confirmed and paid=false (409 otherwise); amount = experience.price * booking.seats computed server-side from the DB — the client only sends a bookingId, never an amount; creates a Stripe Checkout Session (mode=payment, currency=eur), stores session.id on booking.stripeSessionId, returns { url }POST/api/v1/payments/verifyJWTbooking must belong to requester as guest (403); sessionId must match booking.stripeSessionId (400 otherwise); retrieves the session from Stripe and sets paid=true only if payment_status === "paid" (409 otherwise) — the success redirect alone is never treated as proof of payment

Note: Stripe on Express, not a Vercel serverless function as originally planned in Phase 1 — the checkout amount must be read from the database at request time (experience.price * booking.seats), and only the Express server has DB access. Trusting a client-supplied amount would let any guest set their own price. Decided in Task 14.

Note: No Stripe webhooks in the MVP — /payments/verify polls Stripe synchronously (sessions.retrieve()) when the client returns from the hosted Checkout page after a manual "I've paid, verify" action. This is sufficient for a manually-tested demo but not production-grade: a guest who closes the tab before returning is never verified, and nothing re-checks payment status later. Webhooks (a signature-validated POST /api/v1/payments/webhook, stripe listen for local dev) are the production-grade approach, deferred to v2. Decided in Task 14. TEST MODE ONLY — never a live secret key in this repo.

Note: Experience has no city field of its own — city lives on HostProfile. The city filter on GET /experiences resolves in two steps: first find matching HostProfile ids by city, then query Experience with host: { $in: ids }. Decided in Task 5.

Note: PATCH /bookings/:id transitions — pending → confirmed (host manager only); pending → cancelled (guest withdrawing, or host manager declining); confirmed → cancelled (guest only — a manager cannot cancel an already-confirmed booking in the MVP). Any other status change is rejected (400 invalid transition); a valid transition attempted by the wrong actor is rejected (403). Cancelling releases the booked seats (experience.seatsBooked -= booking.seats). Decided in Task 12.

Cross-cutting rules


Three-level authorization middleware: (1) authenticated, (2) manager of that HostProfile, (3) guest of that Booking
Errors: JSON { error: string } with proper status codes (400/401/403/404/409)
409 Conflict for: sold-out seats, double booking


4. Client — pages (React Router 7)

RouteProtectedContent/—Landing + featured experiences/experiences—List with city/tag/date filters (synced with query params)/experiences/:id—Detail + book CTA (if not logged in → redirect to login)/hosts/:id—Nonna's public page: bio, story, reviews, badge/login, /register—/dashboard✅Tabbed double view: "My bookings" (guest) / "My profiles" (manager)/hosts/new✅"Bring your nonna online" wizard/hosts/:id/experiences/new✅Add an experience to one of my host profiles (reached from the dashboard's "My profiles" tab)

State & patterns


AuthContext: current user + token (in-memory state, attached to fetches — no localStorage; a refresh clears the session, same as the language choice. Decided in Task 7: simplicity over persistence for the MVP)
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
