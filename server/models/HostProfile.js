import mongoose from "mongoose";

const hostProfileSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    bio: { type: String, maxlength: 1000 },
    city: { type: String, required: true, index: true },
    neighborhood: { type: String },
    photos: [{ type: String }],
    managers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (managers) => managers.length >= 1,
        message: "A host profile must have at least one manager",
      },
    },
    verified: { type: Boolean, default: false },
    completedExperiences: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("HostProfile", hostProfileSchema);
