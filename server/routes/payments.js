import { Router } from "express";
import Stripe from "stripe";
import Booking from "../models/Booking.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

let stripeClient = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

router.post("/checkout-session", requireAuth, async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate({
      path: "experience",
      select: "title price",
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (!booking.guest.equals(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (booking.status !== "confirmed" || booking.paid) {
      return res
        .status(409)
        .json({ error: "Booking must be confirmed and unpaid to pay" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Payments are not configured" });
    }

    const amount = booking.experience.price * booking.seats;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: { name: booking.experience.title },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking=${booking._id}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({ url: session.url });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify", requireAuth, async (req, res) => {
  const { bookingId, sessionId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (!booking.guest.equals(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!sessionId || sessionId !== booking.stripeSessionId) {
      return res
        .status(400)
        .json({ error: "Session does not match this booking" });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Payments are not configured" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(409).json({ error: "Payment not completed" });
    }

    booking.paid = true;
    await booking.save();

    res.json(booking);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
