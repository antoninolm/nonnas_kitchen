import mongoose from "mongoose";
import HostProfile from "./HostProfile.js";
import User from "./User.js";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    direction: {
      type: String,
      enum: ["guestToHost", "hostToGuest"],
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetHost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostProfile",
      required: function () {
        return this.direction === "guestToHost";
      },
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.direction === "hostToGuest";
      },
    },
    rating: { type: Number, required: true, min: 0, max: 5 },
    text: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ booking: 1, direction: 1 }, { unique: true });

reviewSchema.statics.recomputeHostRating = async function (hostId) {
  const [agg] = await this.aggregate([
    { $match: { direction: "guestToHost", targetHost: hostId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await HostProfile.findByIdAndUpdate(hostId, {
    ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.count : 0,
  });
};

reviewSchema.statics.recomputeGuestRating = async function (userId) {
  const [agg] = await this.aggregate([
    { $match: { direction: "hostToGuest", targetUser: userId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await User.findByIdAndUpdate(userId, {
    ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.count : 0,
  });
};

export default mongoose.model("Review", reviewSchema);
