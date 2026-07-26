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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "support",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const SupportModel = mongoose.model("Support", SupportSchema);

module.exports = SupportModel;
