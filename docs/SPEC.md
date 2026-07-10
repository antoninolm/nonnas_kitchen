Nonna's Kitchen — SPEC.md (source of truth)


This file defines the data model, the APIs and the client pages.
Any deviation must be agreed upon first and recorded here.



1. Key concepts


User: anyone who registers. Can act as a guest (books experiences) and/or a manager (manages one or more HostProfiles). There is no global role field: the role is contextual.
HostProfile: the public profile of the grandmother/grandfather. Not a User — has no login. Managed by one or more Users through the managers array.
Experience: a culinary event published by a HostProfile (date, seats, price).
Booking: a guest's reservation for an Experience. The experience address is visible only once the booking is confirmed.
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

FieldTypeConstraintsexperienceObjectId → ExperiencerequiredguestObjectId → UserrequiredseatsNumberdefault 1, min 1messageStringrequired, max 500 (trust & safety)statusString enumpending / confirmed / cancelled / completed — default pendingstripeSessionIdStringoptional

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

MethodRouteProtectionNotesPOST/bookingsJWTchecks seatsBooked + seats <= seatsTotal; creates with status=pendingGET/bookings/meJWTthe user's bookings as guestPATCH/bookings/:idJWTconfirm → host manager only; cancel → owning guest onlyGET/bookings/:id/addressJWTreturns address only if requester = booking guest and status=confirmedPOST/bookings/:id/reviewJWTbooking guest only, only if status=completed

Payments

MethodRouteProtectionNotesPOST/api/create-checkout-sessionJWTVercel serverless function, Stripe Checkout

Note: Experience has no city field of its own — city lives on HostProfile. The city filter on GET /experiences resolves in two steps: first find matching HostProfile ids by city, then query Experience with host: { $in: ids }. Decided in Task 5.

Cross-cutting rules


Three-level authorization middleware: (1) authenticated, (2) manager of that HostProfile, (3) guest of that Booking
Errors: JSON { error: string } with proper status codes (400/401/403/404/409)
409 Conflict for: sold-out seats, double booking


4. Client — pages (React Router 7)

RouteProtectedContent/—Landing + featured experiences/experiences—List with city/tag/date filters (synced with query params)/experiences/:id—Detail + book CTA (if not logged in → redirect to login)/hosts/:id—Nonna's public page: bio, story, reviews, badge/login, /register—/dashboard✅Tabbed double view: "My bookings" (guest) / "My profiles" (manager)/hosts/new✅"Bring your nonna online" wizard/hosts/:id/experiences/new✅Add an experience to one of my host profiles (reached from the dashboard's "My profiles" tab)

State & patterns


AuthContext: current user + token (persisted, attached to fetches)
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


Express server → Render (env vars: MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY)
Client + Stripe serverless → Vercel
.env in .gitignore, .env.example committed
