import { Router } from "express";
import User from "../models/User.js";
import Review from "../models/Review.js";
import requireAuth from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, avatar, interests } = req.body;

  if (
    interests?.maxPrice !== undefined &&
    (typeof interests.maxPrice !== "number" || interests.maxPrice < 0)
  ) {
    return res
      .status(400)
      .json({ error: "maxPrice must be a non-negative number" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (interests !== undefined) user.interests = interests;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me/reviews", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "ratingAvg ratingCount",
    );
    const reviews = await Review.find({
      targetUser: req.user.id,
      direction: "hostToGuest",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "name avatar" });

    res.json({ reviews, avg: user.ratingAvg, count: user.ratingCount });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public-reputation subset only: name, avatar, createdAt, ratingAvg,
// ratingCount. Never email/interests/password (unlike GET /me, User's
// toJSON only strips password, not email, so this must allowlist).
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name avatar createdAt ratingAvg ratingCount",
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "ratingAvg ratingCount",
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reviews = await Review.find({
      targetUser: req.params.id,
      direction: "hostToGuest",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "name avatar" });

    res.json({ reviews, avg: user.ratingAvg, count: user.ratingCount });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
