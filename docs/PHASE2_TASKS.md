# Nonna's Kitchen — Phase 2 Task Prompts (Booking + Stripe)

> Same workflow as Phase 1: one task at a time, in **plan mode**, review the plan,
> approve, verify against the acceptance criteria, commit, push, `/clear`, next task.
>
> **Design decisions already made** (do not re-litigate in-task; Tasks 11 and 14
> record them in SPEC.md/CLAUDE.md):
>
> - **Payment timing — pay AFTER acceptance**: the guest sends a free booking
>   request (`pending`) → the host manager accepts (`confirmed`) or declines
>   (`cancelled`) → the guest then pays via Stripe Checkout (`paid: true`) →
>   the address is revealed only when the booking is BOTH confirmed AND paid.
>   No refund logic needed: the "no" happens before any money moves.
> - **Status model**: the existing enum (pending / confirmed / cancelled /
>   completed) stays untouched. "Accepted by the manager" = `confirmed`.
>   Payment is tracked separately via a new `paid` boolean — two independent
>   facts (the nonna said yes / the money arrived) need two fields.
> - **Seat reservation**: seats are reserved when the request is created
>   (`seatsBooked` incremented on create), released on any cancellation
>   (guest cancel or manager decline). Confirmed-but-never-paid bookings
>   holding seats is accepted technical debt (documented in Task 17).
> - **Stripe architecture**: checkout-session creation lives on the **Express
>   server** (`POST /api/v1/payments/checkout-session`), NOT on the Vercel
>   serverless function from the original plan. Rationale: the amount must be
>   computed from the database price, never trusted from the client, and only
>   Express has DB access. Task 14 updates CLAUDE.md and SPEC.md to record this
>   deviation and its rationale.
> - **Payment verification**: no webhooks in MVP. On return from Stripe, the
>   client calls a verification endpoint; the server retrieves the session from
>   Stripe with the secret key and checks `payment_status === "paid"` before
>   setting `paid: true`. Trusting the redirect alone is not proof of payment.
>   Webhooks are documented as the production-grade v2.

---

## Task 11 — Booking model + request/list (server)

```
Read CLAUDE.md and docs/SPEC.md. Task: the Booking model and guest-side routes,
server only. Phase 2 flow: request now, pay after acceptance.

- Booking model as in SPEC.md §2, PLUS one new field: paid (Boolean, default
  false). Payment (Stripe) and acceptance (manager) are two independent events
  and need two fields: status tracks the nonna's decision, paid tracks the
  money. Add the paid field to the SPEC.md Booking table in the same commit.
- POST /api/v1/bookings (requireAuth) — creates a REQUEST, no payment involved:
  - body: { experience, seats (default 1), message (required, max 500) }
  - validations: 400 missing message; 404 experience not found or not
    published; 409 if seatsBooked + seats > seatsTotal; 409 on duplicate
    booking (unique compound index { experience, guest })
  - guests cannot book experiences of a host they manage (403) — a nonna's
    grandchild must not book his own nonna
  - on success: increment experience.seatsBooked by seats, create booking with
    status "pending", paid false. Return 201.
- GET /api/v1/bookings/me (requireAuth): the caller's bookings as guest, with
  experience populated (title, recipeName, date, price, photos) and the
  experience's host populated (displayName, city). Never the address.

Do NOT create the manager routes, the address route, or anything Stripe yet.

Acceptance criteria: requesting a published experience works and decrements
availability; overbooking returns 409; double-booking returns 409; booking my
own host's experience returns 403; /bookings/me returns my bookings with
experience data but no address.

After implementing, explain why seats are reserved at request time and what
race condition could still occur with two concurrent requests for the last
seats (and why we accept it for the MVP).
```

---

## Task 12 — Booking management: accept / decline / cancel (server)

```
Task: manager-side booking routes and the status state machine, server only.

- GET /api/v1/hosts/:id/bookings (requireAuth + manager of that host): all
  bookings for that host's experiences, populated with guest (name) and
  experience (title, date), including the paid flag. This is the route already
  listed in SPEC §3.
- PATCH /api/v1/bookings/:id (requireAuth) with body { status }:
  - "confirmed" (= the nonna accepts): only a manager of the booking's
    experience's host, only from "pending"
  - "cancelled":
    - by the guest who owns the booking, from "pending" or "confirmed"
      (withdrawing a request or cancelling an accepted one)
    - by a manager of the host, from "pending" only (= declining a request);
      a manager cannot cancel an already-confirmed booking in the MVP
  - any cancellation releases the seats (decrement experience.seatsBooked by
    booking.seats)
  - invalid transition: 400. Valid transition, wrong actor: 403.
- Reuse findManagedHost for the manager check (host reached via
  booking → experience → host).

Do NOT create the address route or anything Stripe yet.

Acceptance criteria: manager accepts a pending request (200 → confirmed);
manager declines a pending request (200 → cancelled, seats released); guest
withdraws a pending request (seats released); guest cancels a confirmed
booking (seats released); a guest cannot confirm; a manager cannot cancel a
confirmed booking; invalid transitions return 400.

After implementing, explain the status state machine and why every transition
is validated server-side rather than trusting the client.
```

---

## Task 13 — Address reveal (server)

```
Task: the address route. Small, but it is the heart of the product's trust
design.

- GET /api/v1/bookings/:id/address (requireAuth):
  - 404 if booking not found
  - 403 if the requester is not the guest of this booking
  - 409 if the booking is not BOTH status "confirmed" AND paid true — the
    address is the deliverable the guest paid for; acceptance alone is not
    enough, payment alone is impossible (payment requires confirmed status,
    enforced in Task 14)
  - on success: load the experience with .select("+address"), return
    { address }
- This is the ONLY route in the whole API where address leaves the server.

Acceptance criteria: guest of a confirmed AND paid booking gets the address;
same guest on a merely confirmed (unpaid) booking gets 409; another
authenticated user gets 403; address never appears in any other route.

(Full verification of the paid case becomes possible after Task 14 — for now,
flip paid manually in Atlas to test, then flip it back.)

After implementing, explain how select: false + this single opt-in route
implement "address only after acceptance and payment" end-to-end.
```

---

## Task 14 — Stripe checkout + payment verification (server)

```
Task: Stripe integration on the Express server. This task supersedes the
"Vercel serverless function" approach: update CLAUDE.md (stack section) and
SPEC.md (§3 Payments) in this commit, recording the rationale — the checkout
amount must come from the database, never from the client, and only the
Express server has DB access.

- npm install stripe in server/. STRIPE_SECRET_KEY (test mode) from .env
  (already in .env.example). If a payment route is hit without the key, return
  a clear 500 — do not crash the server at startup in dev.
- POST /api/v1/payments/checkout-session (requireAuth):
  - body: { bookingId }
  - 404 unknown booking; 403 if requester is not the booking's guest;
    409 if booking is not status "confirmed" or is already paid — payment is
    only possible AFTER the nonna accepted
  - loads the experience, computes amount = experience.price * booking.seats
    (price already in cents — no conversion)
  - creates a Stripe Checkout Session (mode "payment", currency eur, line item
    named after the experience title, success_url:
    <CLIENT_URL>/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking=<id>,
    cancel_url: <CLIENT_URL>/dashboard)
  - stores session.id in booking.stripeSessionId, returns { url }
- POST /api/v1/payments/verify (requireAuth):
  - body: { bookingId, sessionId }
  - 403 if not the booking's guest; 400 if sessionId does not match
    booking.stripeSessionId
  - retrieves the session from Stripe; if payment_status === "paid", sets
    booking.paid = true and returns the updated booking; otherwise 409
- Document in SPEC.md that webhooks are the production-grade approach,
  deferred to v2. TEST MODE ONLY.

Acceptance criteria (Stripe test card 4242 4242 4242 4242): checkout session
is created with the correct DB-derived amount, and only for confirmed unpaid
bookings (pending → 409); paying on Stripe's hosted page then calling /verify
flips paid to true; verify with a mismatched sessionId fails; the client has
no way to influence the amount.

After implementing, explain why the amount is computed server-side and why the
redirect alone is not proof of payment.
```

---

## Task 15 — Client: booking request flow

```
Task: the guest-side request flow in the client. No payment UI here — payment
happens after acceptance, from the dashboard (Task 16).

- On /experiences/:id, replace the "coming soon" placeholder for authenticated
  guests: a small request form (seats selector capped at seats left, message
  textarea — required, with a short helper text explaining the nonna will
  review the request) and a "Request to book" button.
- Submit: POST /bookings via authFetchJSON → on 201 show a translated inline
  success state ("request sent — you'll be able to pay once it's accepted")
  with a link to the dashboard.
- Handle and translate the API errors: sold out (409), double booking (409),
  own-host booking (403), missing message (400).
- All strings via t(), both dictionaries in parity.

Acceptance criteria: an authenticated guest sends a request from the detail
page and sees the success state; requesting the same experience twice shows
the translated double-booking error; the seats selector never exceeds seats
left; a logged-out visitor still gets redirected to /login by the Book CTA.
```

---

## Task 16 — Client: dashboard bookings + payment + address reveal

```
Task: make both dashboard tabs real. This is where the whole Phase 2 flow
becomes visible: request → acceptance → payment → address.

- "My bookings" (guest), from GET /bookings/me. Each booking shows experience
  title, date, seats, total price (price * seats, formatted), a translated
  status badge, and a paid indicator. Actions by state:
  - pending: "Withdraw request" (PATCH → cancelled, confirm dialog)
  - confirmed && !paid: a prominent "Pay now" button → POST
    /payments/checkout-session → window.location = url (full redirect to
    Stripe's hosted page — an SPA navigation is impossible for an external
    site, and in-memory auth being lost on return is handled below)
  - confirmed && paid: a "Show address" button → GET /bookings/:id/address,
    revealed inline. This is the payoff moment of the whole product.
  - any non-cancelled: "Cancel" where the state machine allows it
- /bookings/success page: reads session_id and booking from the query params
  and calls POST /payments/verify. IMPORTANT: returning from Stripe is a full
  page load, so the in-memory auth is gone — if the user is not authenticated,
  show a translated "log in to confirm your payment" state that redirects to
  /login with state { from: location }, so after login they land back here and
  verification proceeds. Show success (link to dashboard) or a translated
  error if verification fails.
- "My profiles" (manager): under each managed host, a "Booking requests"
  section from GET /hosts/:id/bookings — guest name, experience, date, seats,
  paid indicator, status. Actions: "Accept" and "Decline" on pending requests
  (PATCH → confirmed / cancelled).
- All strings via t().

Acceptance criteria — the full Phase 2 demo in one browser session:
guest@demo.com requests a booking → logout, login as manager@demo.com → the
request appears under the host, Accept it → logout, login as guest → "Pay now"
appears, pay with 4242… → return, log in again on the success page, verify
passes → dashboard shows confirmed + paid → "Show address" reveals the
address. Also: Decline releases seats (catalog seats-left changes), Withdraw
works, EN/IT parity on all new strings.
```

---

## Task 17 — Phase 2 review

```
Task: verification pass, no new features — same format as Task 10.

1. SPEC.md §2 (Booking incl. paid), §3 (Booking + Payments routes) vs code:
   list deviations.
2. CLAUDE.md rules: address leaves the API only via GET /bookings/:id/address
   and only when confirmed && paid; amounts computed only from DB; no Stripe
   secret anywhere in the client or in any commit; all new UI strings in both
   dictionaries.
3. Status state machine: verify every transition (actor × from-state ×
   to-state) is enforced server-side; verify payment is impossible before
   acceptance.
4. Report: done / deviations / technical debt (expected entries: no webhooks,
   confirmed-but-unpaid bookings hold seats indefinitely, no payment deadline).
   Do NOT fix anything — report first, we decide together.
```

---

## Rules of engagement (unchanged from Phase 1)

1. One task → plan → review → approve → verify with YOUR hands → commit → push
2. Reject any plan that exceeds the task's scope
3. Decisions live in SPEC.md/CLAUDE.md, not in the chat
4. Stripe: TEST MODE ONLY. The secret key never appears in chat, in the client
   code, or in any commit. Test card: 4242 4242 4242 4242, any future date,
   any CVC.
