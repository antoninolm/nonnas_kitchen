import { Router } from "express";
import HostProfile from "../models/HostProfile.js";
import requireAuth from "../middleware/auth.js";
import { requireHostManager } from "../middleware/requireManager.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { displayName, city, bio, neighborhood, photos } = req.body;

  if (!displayName || !city) {
    return res.status(400).json({ error: "displayName and city are required" });
  }

  try {
    const host = await HostProfile.create({
      displayName,
      city,
      bio,
      neighborhood,
      photos,
      managers: [req.user.id],
    });
    res.status(201).json(host);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requireHostManager, async (req, res) => {
  const { displayName, bio, city, neighborhood, photos } = req.body;

  if (displayName !== undefined) req.hostProfile.displayName = displayName;
  if (bio !== undefined) req.hostProfile.bio = bio;
  if (city !== undefined) req.hostProfile.city = city;
  if (neighborhood !== undefined) req.hostProfile.neighborhood = neighborhood;
  if (photos !== undefined) req.hostProfile.photos = photos;

  try {
    await req.hostProfile.save();
    res.json(req.hostProfile);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const host = await HostProfile.findById(req.params.id).select("-managers");
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }
    res.json(host);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Host not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
