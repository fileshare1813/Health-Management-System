const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Chat = require("../models/chatModel");
const emailer = require("../nodemailer");

async function createPatient(req, res) {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    return res.status(201).json({ message: "Patient created successfully", patient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function bookAppointment(req, res) {
  try {
    const { name, age, address, email, gender, ailment, bookedSlot, doctorChoice } = req.body;

    if (!name || !age || !address || !email || !gender || !ailment || !bookedSlot || !doctorChoice) {
      return res.status(400).json({ error: "All appointment fields are required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Prescription file is required" });
    }

    const doctor = await Doctor.findById(doctorChoice);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const existingBooking = await Patient.findOne({ doctorChoice, bookedSlot });
    if (existingBooking) {
      return res.status(409).json({
        error: "This slot is already booked for the selected doctor. Please choose another slot.",
      });
    }

    const filePath = req.file.path || req.file.secure_url || req.file.url;
    if (!filePath) {
      return res.status(500).json({ error: "Could not resolve uploaded file path" });
    }

    const patient = new Patient({
      name, age, address, email, gender, ailment, bookedSlot, doctorChoice,
      prescriptions: [filePath],
    });
    await patient.save();

    const subject = "Appointment booked successfully";
    const text = `Your appointment is confirmed for ${bookedSlot} with Dr. ${doctor.name}.`;
    const html = `<p>Dear ${patient.name},</p><p>Your appointment has been booked successfully.</p><p><strong>Doctor:</strong> ${doctor.name}</p><p><strong>Slot:</strong> ${bookedSlot}</p><p>Thank you.</p>`;

    try {
      await emailer.sendMail({ to: patient.email, subject, text, html });
    } catch (mailErr) {
      console.error("Email sending failed (appointment still booked):", mailErr.message);
    }

    return res.status(201).json({ message: "Appointment booked successfully", patient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function uploadPrescription(req, res) {
  try {
    const patientId = req.params.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path || req.file.secure_url || req.file.url;
    if (!filePath) return res.status(500).json({ error: "Could not resolve uploaded file path" });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    patient.prescriptions.push(filePath);
    await patient.save();

    return res.status(200).json({ message: "Prescription uploaded", patient });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getMyAppointments(req, res) {
  try {
    const email = req.user.email;
    const appointments = await Patient.find({ email })
      .populate("doctorChoice", "name specialisation fees")
      .sort({ createdAt: -1 });

    return res.status(200).json({ appointments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ error: "Appointment not found" });

    if (patient.email !== req.user.email) {
      return res.status(403).json({ error: "You can only cancel your own appointments" });
    }

    await Patient.findByIdAndDelete(id);
    return res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Support chat — every logged-in patient has one fixed room
async function getOrCreateMyChat(req, res) {
  try {
    const userId = req.user.id;
    const room = `chat_${userId}`;

    let chat = await Chat.findOne({ room });
    if (!chat) {
      chat = new Chat({
        chatKey: room,
        room,
        type: "support",
        patient: { id: userId, identifier: req.user.username, name: req.user.username },
        status: "open",
      });
      await chat.save();
    }

    return res.status(200).json({ chat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Doctor chat — ONLY allowed if the patient actually has a booked appointment with this doctor
async function getOrCreateDoctorChat(req, res) {
  try {
    const { doctorId } = req.params;
    const userId = req.user.id;
    const email = req.user.email;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const hasAppointment = await Patient.findOne({ email, doctorChoice: doctorId });
    if (!hasAppointment) {
      return res.status(403).json({
        error: "You can only message a doctor you have a booked appointment with",
      });
    }

    const room = `doctor_${doctorId}_patient_${userId}`;

    let chat = await Chat.findOne({ room });
    if (!chat) {
      chat = new Chat({
        chatKey: room,
        room,
        type: "doctor",
        patient: { id: userId, identifier: req.user.username, name: req.user.username },
        doctor: doctor.user
          ? { id: doctor.user, identifier: doctor.name, name: doctor.name }
          : undefined,
        status: "open",
      });
      await chat.save();
    }

    return res.status(200).json({ chat, doctor: { id: doctor._id, name: doctor.name } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createPatient,
  bookAppointment,
  uploadPrescription,
  getMyAppointments,
  cancelAppointment,
  getOrCreateMyChat,
  getOrCreateDoctorChat,
};