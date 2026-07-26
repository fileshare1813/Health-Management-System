const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const User = require("../models/userModel");

async function createDoctor(req, res) {
  let session;
  try {
    const {
      name,
      specialisation,
      degree,
      fees,
      experience,
      gender,
      username,
      email,
      password,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required to create the doctor's login",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase().trim() }],
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already in use" });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "doctor",
    });
    await user.save({ session });

    const doctor = new Doctor({
      name,
      specialisation,
      degree,
      fees,
      experience,
      gender,
      user: user._id,
    });
    await doctor.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ message: "Doctor created successfully", doctor });
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ error: err.message });
  }
}

async function getDoctors(req, res) {
  try {
    const { specialisation, search } = req.query;
    const filter = {};

    if (specialisation) {
      filter.specialisation = { $regex: specialisation, $options: "i" };
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    return res.status(200).json({ doctors });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id).populate({
      path: "feedback",
      populate: { path: "patient", select: "name" },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    return res.status(200).json({ doctor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getMyDoctorAppointments(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      return res
        .status(404)
        .json({ error: "No doctor profile is linked to this account" });
    }

    const appointments = await Patient.find({ doctorChoice: doctor._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ doctor, appointments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  getMyDoctorAppointments,
};