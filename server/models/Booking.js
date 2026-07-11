import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      required: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seats: { type: Number, default: 1, min: 1 },
    message: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paid: { type: Boolean, default: false },
    stripeSessionId: { type: String },
  },
  { timestamps: true },
);

bookingSchema.index({ experience: 1, guest: 1 }, { unique: true });

export default mongoose.model("Booking", bookingSchema);
