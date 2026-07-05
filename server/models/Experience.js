import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostProfile",
      required: true,
    },
    title: { type: String, required: true },
    recipeName: { type: String, required: true },
    story: { type: String, maxlength: 2000 },
    date: { type: Date, required: true },
    durationMin: { type: Number, default: 180 },
    price: { type: Number, required: true },
    seatsTotal: { type: Number, required: true, min: 1, max: 12 },
    seatsBooked: { type: Number, default: 0 },
    address: { type: String, required: true, select: false },
    photos: [{ type: String }],
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published", "completed", "cancelled"],
      default: "draft",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Experience", experienceSchema);
