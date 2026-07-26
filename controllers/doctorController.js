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

module.exports = { createDoctor };
