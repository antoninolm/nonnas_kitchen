# Nonna's Kitchen — Phase 2 Task Prompts (Booking + Stripe)

> Same workflow as Phase 1: one task at a time, in **plan mode**, review the plan,
> approve, verify against the acceptance criteria, **run `npm run smoke`**, commit,
> push, `/clear`, next task.
>
> **Regression net**: `server/smoke-test.js` (run with `npm run smoke` from
> `server/`, dev server must be running) covers the whole booking flow so far.
> Every server task below is followed by a companion **smoke-extension task**
> that grows the net to cover the new routes. Client tasks (15–16) are verified
> in the browser (Playwright by the agent + manually) — the smoke script stays
> API-only on purpose.
>
> **Design decisions already made** (recorded in SPEC.md/CLAUDE.md as tasks land):
>
> - **Payment timing — pay AFTER acceptance**: guest sends a free request
>   (`pending`) → manager accepts (`confirmed`) or declines (`cancelled`) →
>   guest pays via Stripe (`paid: true`) → address revealed only when
>   confirmed AND paid. No refund logic: the "no" happens before money moves.
> - **Status model**: enum untouched (pending/confirmed/cancelled/completed);
>   payment tracked by the separate `paid` boolean — two independent facts.
> - **Seats**: reserved on request creation, released on any cancellation.
>   Confirmed-but-never-paid bookings holding seats = accepted tech debt.
> - **Stripe on Express** (`POST /api/v1/payments/checkout-session`), not the
>   Vercel function: the amount must come from the DB, never from the client.
>   Task 14 records this deviation in CLAUDE.md + SPEC.md.
> - **Payment verification**: no webhooks in MVP; the server retrieves the
>   session from Stripe and checks `payment_status === "paid"`. The redirect
>   alone is never proof of payment. Webhooks = production-grade v2.

---

## ✅ Task 11 — Booking model + request/list (server) — DONE
Committed. Booking model + `paid` field, POST /bookings (validations, seat
reservation, 403 own-host, 409 duplicate/overbooking), GET /bookings/me.
SPEC.md updated with the `paid` field.

## ✅ Task 12 — Booking management (server) — DONE
Committed. PATCH /bookings/:id state machine (TRANSITIONS lookup table,
400-before-403 ordering), GET /hosts/:id/bookings manager inbox, seat release
on any cancellation. SPEC.md transition-table note added.

## ✅ Smoke test v1 — DONE
Committed. `server/smoke-test.js` + `npm run smoke`: 9 checks covering
login, create/increment, duplicate, guest-confirm 403, manager confirm,
manager-cancel-confirmed 403, invalid transition 400, cancel/release,
no-address-in-/me.

---

## Task 13 — Address reveal (server)

```
Read CLAUDE.md and docs/SPEC.md. Task: the address route. Small, but it is
the heart of the product's trust design.

- GET /api/v1/bookings/:id/address (requireAuth):
  - 404 if booking not found
  - 403 if the requester is not the guest of this booking
  - 409 if the booking is not BOTH status "confirmed" AND paid true — the
    address is the deliverable the guest paid for; acceptance alone is not
    enough, payment alone is impossible (payment will require confirmed
    status, enforced in Task 14)
  - on success: load the experience with .select("+address"), return
    { address }
- Register the route in server/routes/bookings.js. Mind the route order
  relative to any existing parametric routes.
- This is the ONLY route in the whole API where address leaves the server.

Do NOT touch the smoke test in this task (next task extends it).

Acceptance criteria: guest of a confirmed AND paid booking gets the address
(flip paid manually in the DB to test until Stripe exists); the same guest on
a merely confirmed booking gets 409; on a pending booking gets 409; another
authenticated user gets 403; address never appears in any other route.

After implementing, explain how select: false + this single opt-in route
implement "address only after acceptance and payment" end-to-end.
```

## Task 13b — Extend smoke test: address checks

```
Task: extend server/smoke-test.js only. No routes, models, or client changes.

Append these checks after the existing 9, keeping the same style (check()
with expected-vs-actual detail) and updating the final X/N summary:

10. Create a fresh booking (guest, manager-owned experience), manager
    confirms it. GET /bookings/:id/address as guest → 409 (confirmed but not
    paid).
11. Flip paid to true directly via mongoose (import the Booking model and
    update the document in the script — justified: Stripe doesn't exist yet;
    add a comment saying Task 14b will replace this manual flip with the real
    verify flow where possible).
12. GET /bookings/:id/address as guest → 200 with a non-empty address string.
13. GET /bookings/:id/address as the manager (not the guest) → 403.
14. GET /bookings/:id/address on a PENDING booking (create another one) → 409.
15. Re-check: the address string from check 12 does NOT appear in
    GET /experiences/:id nor in GET /bookings/me responses.

Note: importing the Booking model means the script now needs a mongoose
connection — connect with connectDB at the start and disconnect at the end,
same guard pattern as seed.js.

Acceptance criteria: npm run smoke → all checks pass (old 9 + new 6), exit 0;
with the server down it still fails fast before touching the DB.

Note: the suite has 20 numbered steps but 19 assertions — step #11 is a
data-setup step (manual paid flip), not a check. A full run reports 19/19
passed (or 16 passed + 3 SKIP without a Stripe key).
```

---

## Task 14 — Stripe checkout + payment verification (server)

```
Task: Stripe integration on the Express server. This supersedes the "Vercel
serverless function" approach: update CLAUDE.md (stack section) and SPEC.md
(§3 Payments) in this commit, recording the rationale — the checkout amount
must come from the database, never from the client, and only the Express
server has DB access.

- npm install stripe in server/. STRIPE_SECRET_KEY (test mode) from .env
  (already in .env.example). If a payment route is hit without the key,
  return a clear 500 — do not crash the server at startup in dev.
- POST /api/v1/payments/checkout-session (requireAuth):
  - body: { bookingId }
  - 404 unknown booking; 403 if requester is not the booking's guest;
    409 if booking is not status "confirmed" or is already paid — payment is
    only possible AFTER the nonna accepted
  - loads the experience, computes amount = experience.price * booking.seats
    (price already in cents — no conversion)
  - creates a Stripe Checkout Session (mode "payment", currency eur, line
    item named after the experience title, success_url:
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

Do NOT touch the smoke test in this task (next task extends it).

Acceptance criteria (Stripe test card 4242 4242 4242 4242, verified manually
in the browser + curl): checkout session created with the correct DB-derived
amount, only for confirmed unpaid bookings (pending → 409); paying on
Stripe's hosted page then calling /verify flips paid to true; verify with a
mismatched sessionId fails; the client cannot influence the amount.

After implementing, explain why the amount is computed server-side and why
the redirect alone is not proof of payment.
```

## Task 14b — Extend smoke test: payment guards

```
Task: extend server/smoke-test.js only. No routes, models, or client changes.

The full happy path (paying on Stripe's hosted page) cannot be automated
without a browser — that stays a manual/Playwright check. The smoke test
covers everything AROUND it, which is where regressions actually happen:

16. POST /payments/checkout-session on a PENDING booking → 409 (payment
    before acceptance must be impossible).
17. POST /payments/checkout-session as the manager (not the guest) → 403.
18. POST /payments/checkout-session on a confirmed unpaid booking → 200 with
    a url field starting with https://checkout.stripe.com (requires
    STRIPE_SECRET_KEY in .env — if absent, print SKIP for checks 18-20 with a
    clear message instead of failing, so the suite still runs on machines
    without the key).
19. POST /payments/verify with a mismatched sessionId → 400.
20. POST /payments/verify with the real sessionId but an UNPAID session → 409
    (the session was created in check 18 but never paid — this proves the
    redirect-is-not-proof rule).
21. Replace Task 13b's manual paid flip comment: keep the mongoose flip (it
    is still the only way to reach the paid state without a browser) but
    update the comment to reference this suite's coverage of the verify
    guards.

Acceptance criteria: npm run smoke → all checks pass (or SKIP for 18-20
without a key), exit 0; the suite leaves the DB re-seeded/clean at the end.

Note: the suite has 20 numbered steps but 19 assertions — step #11 is a
data-setup step (manual paid flip), not a check. A full run reports 19/19
passed (or 16 passed + 3 SKIP without a Stripe key).
```

---

## Task 15 — Client: booking request flow

```
Task: the guest-side request flow in the client. No payment UI here — payment
happens after acceptance, from the dashboard (Task 16).

- On /experiences/:id, replace the "coming soon" placeholder for
  authenticated guests: a small request form (seats selector capped at seats
  left, message textarea — required, with a short helper text explaining the
  nonna will review the request) and a "Request to book" button.
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
Run npm run smoke afterwards to confirm no server regression.
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
    site; in-memory auth loss on return is handled below)
  - confirmed && paid: a "Show address" button → GET /bookings/:id/address,
    revealed inline. This is the payoff moment of the whole product.
  - "Cancel" where the state machine allows it
- /bookings/success page: reads session_id and booking from the query params
  and calls POST /payments/verify. IMPORTANT: returning from Stripe is a full
  page load, so in-memory auth is gone — if unauthenticated, show a
  translated "log in to confirm your payment" state redirecting to /login
  with state { from: location }, so after login the user lands back here and
  verification proceeds. Show success (link to dashboard) or a translated
  error if verification fails.
- "My profiles" (manager): under each managed host, a "Booking requests"
  section from GET /hosts/:id/bookings — guest name, experience, date, seats,
  paid indicator, status. Actions: "Accept" and "Decline" on pending requests
  (PATCH → confirmed / cancelled).
- All strings via t().

Acceptance criteria — the full Phase 2 demo in one browser session:
guest@demo.com requests → login as manager@demo.com → Accept → login as
guest → "Pay now" → 4242… → return, log in on the success page, verify
passes → dashboard shows confirmed + paid → "Show address" reveals it.
Decline releases seats (catalog seats-left changes), Withdraw works, EN/IT
parity everywhere. Run npm run smoke afterwards.
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
4. Run npm run smoke and include the result in the report.
5. Report: done / deviations / technical debt (expected entries: no webhooks,
   confirmed-but-unpaid bookings hold seats indefinitely, no payment
   deadline, manual paid-flip in the smoke test). Do NOT fix anything —
   report first, we decide together.
```

---

## Rules of engagement (updated)

1. One task → plan → review → approve → verify with YOUR hands →
   **npm run smoke** → commit → push
2. Reject any plan that exceeds the task's scope
3. Decisions live in SPEC.md/CLAUDE.md, not in the chat
4. Stripe: TEST MODE ONLY. The secret key never appears in chat, in the
   client code, or in any commit. Test card: 4242 4242 4242 4242, any future
   date, any CVC.
