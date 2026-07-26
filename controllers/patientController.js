const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const emailer = require("../nodemailer");

async function createPatient(req, res) {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    return res
      .status(201)
      .json({ message: "Patient created successfully", patient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function bookAppointment(req, res) {
  try {
    const {
      name,
      age,
      address,
      email,
      gender,
      ailment,
      bookedSlot,
      doctorChoice,
    } = req.body;

    if (
      !name ||
      !age ||
      !address ||
      !email ||
      !gender ||
      !ailment ||
      !bookedSlot ||
      !doctorChoice
    ) {
      return res
        .status(400)
        .json({ error: "All appointment fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Prescription file is required" });
    }

    const doctor = await Doctor.findById(doctorChoice);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const filePath = req.file.path || req.file.secure_url || req.file.url;
    if (!filePath) {
      return res
        .status(500)
        .json({ error: "Could not resolve uploaded file path" });
    }

    const patient = new Patient({
      name,
      age,
      address,
      email,
      gender,
      ailment,
      bookedSlot,
      doctorChoice,
      prescriptions: [filePath],
    });

    await patient.save();

    const subject = "Appointment booked successfully";
    const text = `Your appointment is confirmed for ${bookedSlot} with Dr. ${doctor.name}.`;
    const html = `<p>Dear ${patient.name},</p><p>Your appointment has been booked successfully.</p><p><strong>Doctor:</strong> ${doctor.name}</p><p><strong>Slot:</strong> ${bookedSlot}</p><p>Thank you.</p>`;
    await emailer.sendMail({ to: patient.email, subject, text, html });

    return res.status(201).json({
      message: "Appointment booked successfully",
      patient,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function uploadPrescription(req, res) {
  try {
    const patientId = req.params.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path || req.file.secure_url || req.file.url;
    if (!filePath)
      return res
        .status(500)
        .json({ error: "Could not resolve uploaded file path" });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    patient.prescriptions.push(filePath);
    await patient.save();

    return res.status(200).json({ message: "Prescription uploaded", patient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createPatient, bookAppointment, uploadPrescription };
