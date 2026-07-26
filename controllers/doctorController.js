const Doctor = require("../models/doctorModel");

async function createDoctor(req, res) {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();

    return res
      .status(201)
      .json({ message: "Doctor created successfully", doctor });
  } catch (err) {
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

module.exports = { createDoctor, getDoctors, getDoctorById };