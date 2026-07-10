import { Router } from "express";
import Experience from "../models/Experience.js";
import HostProfile from "../models/HostProfile.js";
import requireAuth from "../middleware/auth.js";
import { findManagedHost } from "../middleware/requireManager.js";

const router = Router();

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/", requireAuth, async (req, res) => {
  const {
    host,
    title,
    recipeName,
    date,
    price,
    seatsTotal,
    address,
    story,
    durationMin,
    photos,
    tags,
  } = req.body;

  if (
    !host ||
    !title ||
    !recipeName ||
    !date ||
    !price ||
    !seatsTotal ||
    !address
  ) {
    return res.status(400).json({
      error:
        "host, title, recipeName, date, price, seatsTotal and address are required",
    });
  }

  try {
    const { host: hostDoc, isManager } = await findManagedHost(
      host,
      req.user.id,
    );
    if (!hostDoc) {
      return res.status(404).json({ error: "Host not found" });
    }
    if (!isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const experience = await Experience.create({
      host,
      title,
      recipeName,
      date,
      price,
      seatsTotal,
      address,
      story,
      durationMin,
      photos,
      tags,
    });
    res.status(201).json(experience);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Host not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id).select(
      "+address",
    );
    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const { isManager } = await findManagedHost(experience.host, req.user.id);
    if (!isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      title,
      recipeName,
      story,
      date,
      durationMin,
      price,
      seatsTotal,
      address,
      photos,
      tags,
      status,
    } = req.body;

    if (title !== undefined) experience.title = title;
    if (recipeName !== undefined) experience.recipeName = recipeName;
    if (story !== undefined) experience.story = story;
    if (date !== undefined) experience.date = date;
    if (durationMin !== undefined) experience.durationMin = durationMin;
    if (price !== undefined) experience.price = price;
    if (seatsTotal !== undefined) experience.seatsTotal = seatsTotal;
    if (address !== undefined) experience.address = address;
    if (photos !== undefined) experience.photos = photos;
    if (tags !== undefined) experience.tags = tags;
    if (status !== undefined) experience.status = status;

    await experience.save();
    res.json(experience);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Experience not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id).select(
      "+address",
    );
    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const { isManager } = await findManagedHost(experience.host, req.user.id);
    if (!isManager) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (experience.status === "draft") {
      await experience.deleteOne();
      return res.status(204).send();
    }

    experience.status = "cancelled";
    await experience.save();
    res.json(experience);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Experience not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  const { city, tag, from, q, host } = req.query;
  const filter = { status: "published" };

  try {
    if (host) {
      filter.host = host;
    }

    if (city) {
      const hosts = await HostProfile.find(
        { city: { $regex: `^${escapeRegExp(city)}$`, $options: "i" } },
        "_id",
      );
      filter.host = { $in: hosts.map((h) => h._id) };
    }

    if (tag) {
      filter.tags = tag;
    }

    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: "Invalid 'from' date" });
      }
      filter.date = { $gte: fromDate };
    }

    if (q) {
      const regex = { $regex: escapeRegExp(q), $options: "i" };
      filter.$or = [{ title: regex }, { recipeName: regex }];
    }

    const experiences = await Experience.find(filter)
      .sort({ date: 1 })
      .populate("host", "displayName city verified photos");
    res.json(experiences);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("host", "displayName city verified photos");

    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }
    res.json(experience);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ error: "Experience not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
