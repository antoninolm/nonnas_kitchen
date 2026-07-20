import "dotenv/config";
import { execSync } from "node:child_process";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Booking from "./models/Booking.js";

// SMOKE_URL lets this suite target a deployed API (e.g. Render) instead of
// localhost. It re-seeds and mutates whatever database MONGODB_URI points
// to, so only run it against the demo/prod DB used for this course
// project — never against a real production database with real user data.
const BASE_URL = process.env.SMOKE_URL || "http://localhost:8080";
let passed = 0;
let failed = 0;
let skipped = 0;

function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? ` (${detail})` : ""}`);
  ok ? passed++ : failed++;
}

function skip(name, detail) {
  console.log(`SKIP - ${name}${detail ? ` (${detail})` : ""}`);
  skipped++;
}

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}

async function main() {
  try {
    await fetch(`${BASE_URL}/api/v1/health`);
  } catch {
    const hint = process.env.SMOKE_URL
      ? "check the deployment is awake (Render free tier sleeps after inactivity) and its logs."
      : "start the dev server first (npm run dev).";
    console.error(`Cannot reach ${BASE_URL}/api/v1/health — ${hint}`);
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  // Spawn `npm run seed` as a subprocess instead of importing seed.js:
  // seed.js calls process.exit() at the end of its own top-level run, which
  // would kill this script too if that code ran in-process. Spawning keeps
  // seed.js untouched and needs no new dependency (child_process is builtin).
  console.log("Re-seeding database...");
  execSync("npm run seed", { stdio: "inherit" });

  // 1. Login guest + manager
  const guestLogin = await request("POST", "/api/v1/auth/login", {
    body: { email: "guest@demo.com", password: "password123" },
  });
  const managerLogin = await request("POST", "/api/v1/auth/login", {
    body: { email: "manager@demo.com", password: "password123" },
  });
  check(
    "login guest + manager",
    guestLogin.status === 200 && managerLogin.status === 200,
    `guest ${guestLogin.status}, manager ${managerLogin.status} (expected 200)`,
  );
  const guestToken = guestLogin.json?.token;
  const managerToken = managerLogin.json?.token;

  // Find a manager-owned, published experience with room for one more seat.
  const hosts = await request("GET", "/api/v1/hosts/mine", { token: managerToken });
  const hostId = hosts.json[0]._id;
  const experiences = await request("GET", `/api/v1/experiences?host=${hostId}`);
  const experience = experiences.json.find((e) => e.status === "published" && e.seatsBooked < e.seatsTotal);
  const seatsBefore = experience.seatsBooked;

  // 2. Guest creates a booking -> 201, seatsBooked incremented
  const booking = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experience._id, seats: 1, message: "Smoke test booking" },
  });
  const afterCreate = await request("GET", `/api/v1/experiences/${experience._id}`);
  check(
    "guest creates booking",
    booking.status === 201 && afterCreate.json.seatsBooked === seatsBefore + 1,
    `status ${booking.status} (expected 201), seatsBooked ${afterCreate.json.seatsBooked} (expected ${seatsBefore + 1})`,
  );
  const bookingId = booking.json._id;

  // 2b. Manager inbox: guest populated with name + avatar, never email (Task 39)
  const hostBookings = await request("GET", `/api/v1/hosts/${hostId}/bookings`, {
    token: managerToken,
  });
  const inboxGuest = hostBookings.json?.find((b) => b._id === bookingId)?.guest;
  check(
    "host bookings expose guest name + avatar, never email",
    hostBookings.status === 200 &&
      typeof inboxGuest?.name === "string" &&
      typeof inboxGuest?.avatar === "string" &&
      inboxGuest.avatar.length > 0 &&
      !hostBookings.text.includes("guest@demo.com"),
    `status ${hostBookings.status} (expected 200), guest ${JSON.stringify(inboxGuest)}`,
  );

  // 3. Duplicate booking -> 409
  const duplicate = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experience._id, seats: 1, message: "Smoke test booking again" },
  });
  check("duplicate booking rejected", duplicate.status === 409, `status ${duplicate.status} (expected 409)`);

  // 4. Guest tries to confirm -> 403
  const guestConfirm = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: guestToken,
    body: { status: "confirmed" },
  });
  check("guest cannot confirm", guestConfirm.status === 403, `status ${guestConfirm.status} (expected 403)`);

  // 5. Manager confirms -> 200, status confirmed
  const managerConfirm = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: managerToken,
    body: { status: "confirmed" },
  });
  check(
    "manager confirms",
    managerConfirm.status === 200 && managerConfirm.json?.status === "confirmed",
    `status ${managerConfirm.status} (expected 200), booking.status ${managerConfirm.json?.status} (expected confirmed)`,
  );

  // 6. Manager tries to cancel the confirmed booking -> 403
  const managerCancel = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: managerToken,
    body: { status: "cancelled" },
  });
  check("manager cannot cancel confirmed booking", managerCancel.status === 403, `status ${managerCancel.status} (expected 403)`);

  // 7. Invalid transition (status: "pending") -> 400
  const invalidTransition = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: guestToken,
    body: { status: "pending" },
  });
  check("invalid status rejected", invalidTransition.status === 400, `status ${invalidTransition.status} (expected 400)`);

  // 8. Guest cancels -> 200, seatsBooked released
  const guestCancel = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: guestToken,
    body: { status: "cancelled" },
  });
  const afterCancel = await request("GET", `/api/v1/experiences/${experience._id}`);
  check(
    "guest cancels booking",
    guestCancel.status === 200 && afterCancel.json.seatsBooked === seatsBefore,
    `status ${guestCancel.status} (expected 200), seatsBooked ${afterCancel.json.seatsBooked} (expected ${seatsBefore})`,
  );

  // 9. GET /bookings/me never contains "address"
  const myBookings = await request("GET", "/api/v1/bookings/me", { token: guestToken });
  check(
    "address never appears in /bookings/me",
    myBookings.status === 200 && !myBookings.text.includes("address"),
    `status ${myBookings.status} (expected 200)`,
  );

  // Additional manager-owned experiences for checks 10-15, distinct from
  // `experience` (already used by checks 2-8) to avoid the unique
  // (experience, guest) index rejecting a fresh booking with 409.
  const managerExperiences = [];
  for (const host of hosts.json) {
    const res = await request("GET", `/api/v1/experiences?host=${host._id}`);
    managerExperiences.push(...res.json);
  }
  const otherExperiences = managerExperiences.filter(
    (e) => e.status === "published" && e.seatsBooked < e.seatsTotal && e._id !== experience._id,
  );
  const experienceB = otherExperiences[0];
  const experienceC = otherExperiences[1];

  // 10. Fresh booking, manager confirms -> address is 409 (confirmed but unpaid)
  const bookingB = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experienceB._id, seats: 1, message: "Smoke test booking B" },
  });
  const bookingBId = bookingB.json._id;
  await request("PATCH", `/api/v1/bookings/${bookingBId}`, {
    token: managerToken,
    body: { status: "confirmed" },
  });
  const addressUnpaid = await request("GET", `/api/v1/bookings/${bookingBId}/address`, {
    token: guestToken,
  });
  check(
    "address hidden when confirmed but unpaid",
    addressUnpaid.status === 409,
    `status ${addressUnpaid.status} (expected 409)`,
  );

  // 11. Flip paid to true directly via Mongoose.
  // Justified: the real Stripe Checkout page can't be driven headlessly, so
  // this remains the only way to reach the paid state without a browser.
  // Checks 16-21 below cover the guards around checkout-session and verify
  // that make this manual flip safe (payment only possible once confirmed,
  // verify never trusts an unverified or mismatched session).
  await Booking.findByIdAndUpdate(bookingBId, { paid: true });

  // 12. GET address as guest -> 200 with a non-empty address string
  const addressPaid = await request("GET", `/api/v1/bookings/${bookingBId}/address`, {
    token: guestToken,
  });
  check(
    "address visible once confirmed and paid",
    addressPaid.status === 200 &&
      typeof addressPaid.json?.address === "string" &&
      addressPaid.json.address.length > 0,
    `status ${addressPaid.status} (expected 200), address "${addressPaid.json?.address}"`,
  );
  const revealedAddress = addressPaid.json?.address;

  // 13. GET address as the manager (not the guest) -> 403
  const addressAsManager = await request("GET", `/api/v1/bookings/${bookingBId}/address`, {
    token: managerToken,
  });
  check(
    "manager cannot view guest's address",
    addressAsManager.status === 403,
    `status ${addressAsManager.status} (expected 403)`,
  );

  // 14. GET address on a still-pending booking -> 409
  const bookingC = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experienceC._id, seats: 1, message: "Smoke test booking C" },
  });
  const addressPending = await request("GET", `/api/v1/bookings/${bookingC.json._id}/address`, {
    token: guestToken,
  });
  check(
    "address hidden on pending booking",
    addressPending.status === 409,
    `status ${addressPending.status} (expected 409)`,
  );

  // 15. The revealed address must not leak into /experiences/:id or /bookings/me
  const experienceAfter = await request("GET", `/api/v1/experiences/${experienceB._id}`);
  const myBookingsAfter = await request("GET", "/api/v1/bookings/me", { token: guestToken });
  check(
    "revealed address does not leak into /experiences/:id or /bookings/me",
    !experienceAfter.text.includes(revealedAddress) && !myBookingsAfter.text.includes(revealedAddress),
    `experience response leaks address: ${experienceAfter.text.includes(revealedAddress)}, bookings/me leaks address: ${myBookingsAfter.text.includes(revealedAddress)}`,
  );

  // 16. checkout-session on a still-pending booking -> 409 (no payment before acceptance)
  const checkoutPending = await request("POST", "/api/v1/payments/checkout-session", {
    token: guestToken,
    body: { bookingId: bookingC.json._id },
  });
  check(
    "checkout-session rejected on pending booking",
    checkoutPending.status === 409,
    `status ${checkoutPending.status} (expected 409)`,
  );

  // Fresh confirmed-unpaid booking for checks 17-20, distinct from the
  // bookings above to avoid the unique (experience, guest) index.
  const experienceD = otherExperiences[2];
  const bookingD = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experienceD._id, seats: 1, message: "Smoke test booking D" },
  });
  const bookingDId = bookingD.json._id;
  await request("PATCH", `/api/v1/bookings/${bookingDId}`, {
    token: managerToken,
    body: { status: "confirmed" },
  });

  // 17. checkout-session as the manager (not the guest) -> 403
  const checkoutAsManager = await request("POST", "/api/v1/payments/checkout-session", {
    token: managerToken,
    body: { bookingId: bookingDId },
  });
  check(
    "checkout-session rejected for non-guest",
    checkoutAsManager.status === 403,
    `status ${checkoutAsManager.status} (expected 403)`,
  );

  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  if (!hasStripeKey) {
    const reason = "STRIPE_SECRET_KEY not set in .env — cannot create or inspect real Stripe sessions";
    skip("checkout-session returns a Stripe checkout URL", reason);
    skip("verify rejects a mismatched sessionId", reason);
    skip("verify rejects an unpaid session (redirect is not proof of payment)", reason);
  } else {
    // 18. checkout-session on the confirmed unpaid booking -> 200 with a Stripe URL
    const checkoutOk = await request("POST", "/api/v1/payments/checkout-session", {
      token: guestToken,
      body: { bookingId: bookingDId },
    });
    check(
      "checkout-session returns a Stripe checkout URL",
      checkoutOk.status === 200 && checkoutOk.json?.url?.startsWith("https://checkout.stripe.com"),
      `status ${checkoutOk.status} (expected 200), url "${checkoutOk.json?.url}"`,
    );

    // 19. verify with a mismatched sessionId -> 400
    const verifyMismatch = await request("POST", "/api/v1/payments/verify", {
      token: guestToken,
      body: { bookingId: bookingDId, sessionId: "cs_test_does_not_match" },
    });
    check(
      "verify rejects a mismatched sessionId",
      verifyMismatch.status === 400,
      `status ${verifyMismatch.status} (expected 400)`,
    );

    // 20. verify with the real sessionId, but that session was never paid -> 409.
    // This is the concrete proof that the Checkout redirect alone means nothing:
    // the session from check 18 exists and matches, yet payment never happened.
    const bookingsAfterCheckout = await request("GET", "/api/v1/bookings/me", { token: guestToken });
    const realSessionId = bookingsAfterCheckout.json.find((b) => b._id === bookingDId)?.stripeSessionId;
    const verifyUnpaid = await request("POST", "/api/v1/payments/verify", {
      token: guestToken,
      body: { bookingId: bookingDId, sessionId: realSessionId },
    });
    check(
      "verify rejects an unpaid session (redirect is not proof of payment)",
      verifyUnpaid.status === 409,
      `status ${verifyUnpaid.status} (expected 409)`,
    );
  }

  // 21. GET /users/me -> 200 with the guest's email, never the password
  const me = await request("GET", "/api/v1/users/me", { token: guestToken });
  check(
    "GET /users/me returns current user without password",
    me.status === 200 && me.json?.email === "guest@demo.com" && !me.text.includes("password"),
    `status ${me.status} (expected 200), email ${me.json?.email}, contains password: ${me.text.includes("password")}`,
  );

  // 22. PATCH /users/me updates name + interests, never the password
  const patched = await request("PATCH", "/api/v1/users/me", {
    token: guestToken,
    body: {
      name: "Smoke Guest",
      interests: { city: "Bologna", maxPrice: 5000, tags: ["pasta", "vegetarian"] },
    },
  });
  check(
    "PATCH /users/me updates name and interests without password",
    patched.status === 200 &&
      patched.json?.name === "Smoke Guest" &&
      patched.json?.interests?.city === "Bologna" &&
      patched.json?.interests?.maxPrice === 5000 &&
      !patched.text.includes("password"),
    `status ${patched.status} (expected 200), name ${patched.json?.name}, interests ${JSON.stringify(patched.json?.interests)}`,
  );

  // 23. GET /users/me again -> the PATCH round-trips (values persisted)
  const meAfter = await request("GET", "/api/v1/users/me", { token: guestToken });
  check(
    "PATCH /users/me persists (round-trip)",
    meAfter.json?.name === "Smoke Guest" &&
      meAfter.json?.interests?.maxPrice === 5000 &&
      meAfter.json?.interests?.tags?.length === 2,
    `name ${meAfter.json?.name}, interests ${JSON.stringify(meAfter.json?.interests)}`,
  );

  // 24. GET /users/me without a token -> 401
  const meNoAuth = await request("GET", "/api/v1/users/me");
  check(
    "GET /users/me requires authentication",
    meNoAuth.status === 401,
    `status ${meNoAuth.status} (expected 401)`,
  );

  await mongoose.disconnect();
  console.log(`\n${passed}/${passed + failed} passed${skipped ? `, ${skipped} skipped` : ""}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err.message);
  process.exit(1);
});
