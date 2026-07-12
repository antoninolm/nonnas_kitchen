const BASE_URL = "http://localhost:8080";

function fail(msg) {
  console.error(msg);
  process.exit(1);
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

const eur = (cents) => `€${(cents / 100).toFixed(2)}`;

async function checkServerUp() {
  try {
    await fetch(`${BASE_URL}/api/v1/health`);
  } catch {
    fail(`Cannot reach ${BASE_URL} — start the dev server first (npm run dev).`);
  }
}

async function login(email) {
  const res = await request("POST", "/api/v1/auth/login", {
    body: { email, password: "password123" },
  });
  if (res.status !== 200 || !res.json?.token) {
    fail(`Login failed for ${email}: status ${res.status} ${res.text}`);
  }
  return res.json.token;
}

function explainStripe500() {
  fail(
    "500 — STRIPE_SECRET_KEY is likely missing or invalid in server/.env. " +
      "Add your Stripe test-mode secret key, restart `npm run dev`, and try again.",
  );
}

async function runSetup() {
  await checkServerUp();
  const guestToken = await login("guest@demo.com");
  const managerToken = await login("manager@demo.com");

  // The unique (experience, guest) index blocks re-booking an experience the
  // guest already has a record for, even a cancelled one — skip those so
  // this script stays rerunnable across repeated manual test sessions.
  const myBookings = await request("GET", "/api/v1/bookings/me", { token: guestToken });
  const bookedIds = new Set((myBookings.json ?? []).map((b) => b.experience._id));

  const hosts = await request("GET", "/api/v1/hosts/mine", { token: managerToken });
  if (!hosts.json?.length) fail("manager@demo.com manages no hosts — run `npm run seed` first.");

  let experience = null;
  for (const host of hosts.json) {
    const experiences = await request("GET", `/api/v1/experiences?host=${host._id}`);
    experience = experiences.json?.find(
      (e) => e.status === "published" && e.seatsBooked + 2 <= e.seatsTotal && !bookedIds.has(e._id),
    );
    if (experience) break;
  }
  if (!experience) {
    fail(
      "No unbooked published experience with 2 free seats found for this manager's hosts " +
        "— run `npm run seed` to reset demo data.",
    );
  }

  const booking = await request("POST", "/api/v1/bookings", {
    token: guestToken,
    body: { experience: experience._id, seats: 2, message: "Manual payment test booking" },
  });
  if (booking.status !== 201) fail(`Booking creation failed: status ${booking.status} ${booking.text}`);
  const bookingId = booking.json._id;

  const confirm = await request("PATCH", `/api/v1/bookings/${bookingId}`, {
    token: managerToken,
    body: { status: "confirmed" },
  });
  if (confirm.status !== 200) fail(`Manager confirm failed: status ${confirm.status} ${confirm.text}`);

  const checkout = await request("POST", "/api/v1/payments/checkout-session", {
    token: guestToken,
    body: { bookingId },
  });
  if (checkout.status === 500) explainStripe500();
  if (checkout.status !== 200 || !checkout.json?.url) {
    fail(`Checkout session failed: status ${checkout.status} ${checkout.text}`);
  }

  const amount = experience.price * 2;
  console.log(`\nBooking id: ${bookingId}`);
  console.log(`Expected amount: ${eur(amount)} (${eur(experience.price)} x 2 seats)`);
  console.log(`\nOPEN THIS IN YOUR BROWSER AND PAY WITH 4242 4242 4242 4242:`);
  console.log(checkout.json.url);
  console.log(
    `\nAfter paying, copy the session_id from the redirect URL and run:\n` +
      `  node pay-test.js verify ${bookingId} <session_id-from-redirect-url>\n`,
  );
}

async function runVerify(bookingId, sessionId) {
  if (!bookingId || !sessionId) fail("Usage: node pay-test.js verify <bookingId> <sessionId>");

  await checkServerUp();
  const guestToken = await login("guest@demo.com");

  const verify = await request("POST", "/api/v1/payments/verify", {
    token: guestToken,
    body: { bookingId, sessionId },
  });
  console.log(`\nVerify response: status ${verify.status}`);
  console.log(verify.json ?? verify.text);

  if (verify.status === 500) explainStripe500();
  if (verify.status !== 200 || verify.json?.paid !== true) fail("\nPayment not confirmed as paid.");

  const address = await request("GET", `/api/v1/bookings/${bookingId}/address`, { token: guestToken });
  console.log("\nPAID! Revealed address:");
  console.log(address.json?.address ?? `(unexpected ${address.status}: ${address.text})`);
}

const [, , cmd, arg1, arg2] = process.argv;
cmd === "verify" ? runVerify(arg1, arg2) : runSetup();
