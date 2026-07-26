const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Feedback = require("../models/feedbackModel");
const mongoose = require("mongoose");

async function createFeedback(req, res) {
  try {
    const { doctorId, patientId, rating, comment } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const feedback = new Feedback({
      doctor: doctor._id,
      patient: patient._id,
      rating,
      comment,
    });

    await feedback.save({ session });
    doctor.feedback.push(feedback._id);
    await doctor.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ message: "Feedback created successfully", feedback });
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ error: err.message });
  }
}

async function getPositiveFeedback(req, res) {
  try {
    const feedbacks = await Feedback.aggregate([
      { $match: { rating: 4 } },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $project: {
          rating: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          "doctor._id": 1,
          "doctor.name": 1,
          "doctor.department": 1,
          "doctor.specialisation": 1,
          "patient._id": 1,
          "patient.name": 1,
          "patient.age": 1,
          "patient.gender": 1,
        },
      },
    ]);

    return res.status(200).json({ feedbacks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createFeedback, getPositiveFeedback };
