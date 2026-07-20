import { Router } from "express";
import Booking from "../models/Booking.js";
import Experience from "../models/Experience.js";
import HostProfile from "../models/HostProfile.js";
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

router.get("/me", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user.id }).populate({
      path: "experience",
      select: "title recipeName date price photos",
      populate: { path: "host", select: "displayName city" },
    });
    res.json(bookings);
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
      });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
