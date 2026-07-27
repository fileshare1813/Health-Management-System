const mongoose = require("mongoose");

const SupportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: "support",
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Login/auth is handled by the User model — this just links the profile
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
  },
  { timestamps: true },
);

const SupportModel = mongoose.model("Support", SupportSchema);

module.exports = SupportModel;