const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    specialisation: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    availableSlots: {
      type: [String],
      default: [],
    },
    fees: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    experience: {
      type: Number,
      min: 0,
      required: true,
    },
    feedback: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Feedback",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const DoctorModel = mongoose.model("Doctor", DoctorSchema);

module.exports = DoctorModel;
