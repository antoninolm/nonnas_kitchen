import "dotenv/config";
import { execSync } from "node:child_process";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Booking from "./models/Booking.js";

const BASE_URL = "http://localhost:8080";
let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? ` (${detail})` : ""}`);
  ok ? passed++ : failed++;
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
    console.error(`Cannot reach ${BASE_URL}/api/v1/health — start the dev server first (npm run dev).`);
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
  // Justified: Stripe checkout doesn't exist yet — task 14b will replace this
  // manual flip with the real payment-verification flow where possible.
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

  await mongoose.disconnect();
  console.log(`\n${passed}/${passed + failed} passed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err.message);
  process.exit(1);
});
