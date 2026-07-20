import { Router } from "express";
import Booking from "../models/Booking.js";
import Experience from "../models/Experience.js";
import HostProfile from "../models/HostProfile.js";
import Review from "../models/Review.js";
import requireAuth from "../middleware/auth.js";
import { findManagedHost } from "../middleware/requireManager.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { experience, seats = 1, message } = req.body;

  if (!message || message.length > 500) {
    return res.status(400).json({
      error: "message is required and must be at most 500 characters",
    });
  }

  try {
    const experienceDoc = await Experience.findOne({
      _id: experience,
      status: "published",
    });
    if (!experienceDoc) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const { isManager } = await findManagedHost(
      experienceDoc.host,
      req.user.id,
    );
    if (isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (experienceDoc.seatsBooked + seats > experienceDoc.seatsTotal) {
      return res.status(409).json({ error: "Not enough seats available" });
    }

    const booking = await Booking.create({
      experience: experienceDoc._id,
      guest: req.user.id,
      seats,
      message,
      status: "pending",
      paid: false,
    });

    await Experience.findByIdAndUpdate(experienceDoc._id, {
      $inc: { seatsBooked: seats },
    });

    res.status(201).json(booking);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Experience not found" });
    }
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "You already have a booking for this experience" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

const TRANSITIONS = {
  "pending->confirmed": { managerOnly: true },
  "pending->cancelled": { guestOrManager: true },
  "confirmed->cancelled": { guestOnly: true },
};

router.patch("/:id", requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!["confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "experience",
      select: "host",
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const rule = TRANSITIONS[`${booking.status}->${status}`];
    if (!rule) {
      return res.status(400).json({ error: "Invalid transition" });
    }

    const isGuest = booking.guest.equals(req.user.id);
    const { isManager } = await findManagedHost(
      booking.experience.host,
      req.user.id,
    );

    const authorized =
      (rule.managerOnly && isManager) ||
      (rule.guestOnly && isGuest) ||
      (rule.guestOrManager && (isGuest || isManager));

    if (!authorized) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (status === "cancelled") {
      await Experience.findByIdAndUpdate(booking.experience._id, {
        $inc: { seatsBooked: -booking.seats },
      });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/address", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (!booking.guest.equals(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (booking.status !== "confirmed" || !booking.paid) {
      return res
        .status(409)
        .json({ error: "Booking is not confirmed and paid" });
    }

    const experience = await Experience.findById(booking.experience).select(
      "+address",
    );

    res.json({ address: experience.address });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Guest reviews the host (direction=guestToHost) or a manager of the
// experience's host reviews the guest (direction=hostToGuest) — inferred
// from who the requester is relative to the booking, never sent by the
// client. Eligibility is a recorded SPEC deviation: Booking.status never
// actually reaches "completed" in this codebase, so a booking is
// reviewable once it's confirmed, paid, and its experience date is past.
router.post("/:id/review", requireAuth, async (req, res) => {
  const { rating, text } = req.body;

  if (typeof rating !== "number" || rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ error: "rating must be a number between 0 and 5" });
  }
  if (text !== undefined && (typeof text !== "string" || text.length > 1000)) {
    return res
      .status(400)
      .json({ error: "text must be at most 1000 characters" });
  }

  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "experience",
      select: "host date",
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const isGuest = booking.guest.equals(req.user.id);
    const { isManager } = await findManagedHost(
      booking.experience.host,
      req.user.id,
    );
    if (!isGuest && !isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const eligible =
      booking.status === "confirmed" &&
      booking.paid &&
      booking.experience.date < new Date();
    if (!eligible) {
      return res
        .status(409)
        .json({ error: "Booking is not eligible for a review yet" });
    }

    const direction = isGuest ? "guestToHost" : "hostToGuest";
    const existing = await Review.findOne({ booking: booking._id, direction });
    if (existing) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this booking" });
    }

    const review = await Review.create({
      booking: booking._id,
      direction,
      author: req.user.id,
      rating,
      text,
      ...(direction === "guestToHost"
        ? { targetHost: booking.experience.host }
        : { targetUser: booking.guest }),
    });

    if (direction === "guestToHost") {
      await Review.recomputeHostRating(booking.experience.host);
    } else {
      await Review.recomputeGuestRating(booking.guest);
    }

    res.status(201).json(review);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "You have already reviewed this booking" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id })
      .populate({
        path: "experience",
        select: "title recipeName date price photos",
        populate: { path: "host", select: "displayName city" },
      })
      .lean();

    const reviewed = await Review.find(
      {
        booking: { $in: bookings.map((b) => b._id) },
        direction: "guestToHost",
      },
      "booking",
    ).lean();
    const reviewedSet = new Set(reviewed.map((r) => String(r.booking)));
    const now = new Date();

    res.json(
      bookings.map((b) => ({
        ...b,
        reviewable:
          b.status === "confirmed" &&
          b.paid &&
          new Date(b.experience.date) < now &&
          !reviewedSet.has(String(b._id)),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// All bookings across every host the current user manages, any status,
// sorted newest first. Cross-host aggregate (Task 39b) — unlike
// GET /hosts/:id/bookings this isn't scoped to one host, so it can't use
// requireHostManager (that middleware is single-host-id scoped via
// req.params.id).
router.get("/received", requireAuth, async (req, res) => {
  try {
    const hosts = await HostProfile.find({ managers: req.user.id }, "_id");
    const experiences = await Experience.find(
      { host: { $in: hosts.map((h) => h._id) } },
      "_id",
    );
    const bookings = await Booking.find({
      experience: { $in: experiences.map((e) => e._id) },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "guest", select: "name avatar" })
      .populate({
        path: "experience",
        select: "title date",
        populate: { path: "host", select: "displayName photos" },
      })
      .lean();

    // The unique index is { booking, direction } (not per-manager), so if
    // any manager of a multi-manager host already reviewed the guest, this
    // is correctly false for every manager, not just the one who wrote it.
    const reviewed = await Review.find(
      {
        booking: { $in: bookings.map((b) => b._id) },
        direction: "hostToGuest",
      },
      "booking",
    ).lean();
    const reviewedSet = new Set(reviewed.map((r) => String(r.booking)));
    const now = new Date();

    res.json(
      bookings.map((b) => ({
        ...b,
        reviewable:
          b.status === "confirmed" &&
          b.paid &&
          new Date(b.experience.date) < now &&
          !reviewedSet.has(String(b._id)),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
