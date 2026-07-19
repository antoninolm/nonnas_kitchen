import { Router } from "express";
import User from "../models/User.js";
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

export default router;
