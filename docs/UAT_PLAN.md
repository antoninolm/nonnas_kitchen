# Nonna's Kitchen — UAT Plan (production)

> Run everything against **https://nonnas-kitchen.vercel.app** in a real
> browser, as an end user — not as the developer. Log every finding in
> docs/UAT_FINDINGS.md (template + pre-filled findings provided), even the
> small/ugly ones: the design phase comes next and feeds on them.
>
> Before starting: run the prod seed if the demo data has been mutated by
> smoke runs (bookings left around are fine — a clean slate is nicer).
> First request after idle may take ~50s (Render cold start) — not a finding,
> already known tech debt.
>
> For each step note: what you did → what you expected → what happened.
> If expected == happened, move on. If not, it's a finding.

---

## Persona A — Visitatore (not logged in)

A1. Land on / — does the hero explain the product in 5 seconds? Would a
    stranger understand what this site sells?
A2. Featured experiences on the landing: do the 3 cards show, with photos,
    dates, prices formatted as EUR?
A3. Open the catalog. Try each filter alone: city, tag, date. Then combine
    them. Do results change correctly? Does the URL update (shareable link)?
A4. Apply filters that match nothing — is the empty state understandable
    or just a blank page?
A5. Open an experience detail: photo, story, host, date, price, seats left
    all present and readable?
A6. Click the host's name/profile: does the nonna's public page show bio,
    photos, her upcoming experiences?
A7. Click "Book" while logged out → expected: redirect to /login.
A8. Switch EN ↔ IT on every page visited: all strings translate? Dates and
    prices reformat? Anything left hardcoded?
A9. Hard refresh on a deep link (/experiences/:id) → page loads, no 404.
A10. Mobile check: open the site on your phone (or DevTools device mode).
     Is the catalog usable? The detail page? Note everything broken or ugly.

## Persona B — Guest che prenota

B1. Register a new account. Try bad inputs first: existing email, short
    password, empty fields → are errors shown and translated?
B2. Log in. Navbar shows your name?
B3. Request a booking: seats selector capped at seats left? Message required?
B4. Success state after request: clear? Link to dashboard works?
B5. Request the SAME experience again → expected: translated double-booking
    error (409).
B6. Dashboard "My bookings": the pending booking shows title, date, seats,
    total price, status badge.
B7. Withdraw the request (confirm dialog) → status becomes cancelled; seats
    released (check the catalog seats-left before/after).
B8. Make a new request. Have the manager accept it (persona C, step C4),
    then come back: "Pay now" visible on the confirmed booking.
B9. Pay with 4242 4242 4242 4242. Return from Stripe: the re-login gate —
    note exactly how confusing it feels (known finding F1, add detail).
B10. After verify: booking shows confirmed + paid → "Show address" reveals
     the address inline.
B11. Try to break it: as a logged-in guest, request a booking on an
     experience of a host YOU manage (use manager@demo.com for this) →
     expected: translated own-host error (403).
B12. EN/IT parity across the whole booking flow, including error messages.

## Persona C — Nipote che gestisce (manager@demo.com / password123)

C1. Dashboard "My profiles": Carmela and Assunta listed.
C2. "Bring your nonna online" wizard: create a NEW host profile + first
    experience from scratch. Any confusing step? Validation errors clear?
C3. The new experience appears in the public catalog (published) with all
    its data.
C4. Booking requests inbox: the pending request from persona B shows guest
    name, experience, date, seats. Accept it.
C5. Decline flow: have persona B create another request, decline it →
    seats released in the catalog.
C6. Edit an experience (PATCH): change a field, verify it updates publicly.
C7. Delete: on a draft experience → hard delete; on a published one →
    becomes cancelled and disappears from the catalog.
C8. As manager, verify you CANNOT see the address of B's booking and cannot
    pay for it (guest-only actions).
C9. EN/IT parity on all management pages.

## Cross-cutting

X1. Token expiry: the JWT lasts 1h. If a session goes stale, does the app
    fail gracefully (redirect to login) or break silently? (Simulate: log
    in, wait/lunch, come back.)
X2. Two tabs open with different accounts (in-memory auth = per-tab): any
    weirdness worth noting?
X3. Overall look & feel notes per page — feed material for the design phase:
    what feels emptiest? What would you fix first visually?quindi non si possooautomatizzare?
    
