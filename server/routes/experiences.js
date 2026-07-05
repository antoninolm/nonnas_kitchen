import { Router } from "express";
import Experience from "../models/Experience.js";
import requireAuth from "../middleware/auth.js";
import { findManagedHost } from "../middleware/requireManager.js";

const router = Router();

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

export default router;
