const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    ailment: {
      type: String,
      required: true,
    },
    bookedSlot: {
      type: String,
    },
    doctorChoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    prescriptions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const PatientModel = mongoose.model("Patient", PatientSchema);

module.exports = PatientModel;
