const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Feedback = require("../models/feedbackModel");
const mongoose = require("mongoose");

async function recalculateDoctorRating(doctorId) {
  const stats = await Feedback.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: "$doctor", avgRating: { $avg: "$rating" } } },
  ]);

  const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  await Doctor.findByIdAndUpdate(doctorId, { rating: avgRating });
  return avgRating;
}

async function createFeedback(req, res) {
  let session;
  try {
    const { doctorId, patientId, rating, comment } = req.body;
    session = await mongoose.startSession();
    session.startTransaction();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Doctor not found" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      await session.abortTransaction();
      session.endSession();
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

    // Keep the doctor's overall rating in sync with all feedback received
    await recalculateDoctorRating(doctor._id);

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
    // Fixed: was matching rating === 4 exactly, now correctly matches 4 and above
    const feedbacks = await Feedback.aggregate([
      { $match: { rating: { $gte: 4 } } },
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

async function getFeedbackByDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    const feedbacks = await Feedback.find({ doctor: doctorId })
      .populate("patient", "name age gender")
      .sort({ createdAt: -1 });

    return res.status(200).json({ feedbacks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createFeedback, getPositiveFeedback, getFeedbackByDoctor };