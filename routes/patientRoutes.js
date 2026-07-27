const express = require("express");
const { body } = require("express-validator");
const {
  createPatient,
  bookAppointment,
  uploadPrescription,
  getMyAppointments,
  cancelAppointment,
  getOrCreateMyChat,
  getOrCreateDoctorChat,
} = require("../controllers/patientController");
const validate = require("../utils/validate");
const upload = require("../middlewares/upload");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/add-patient",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("age").isNumeric().withMessage("Age must be a number"),
    body("address").notEmpty().withMessage("Address is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("gender").isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    body("ailment").notEmpty().withMessage("Ailment is required"),
  ]),
  createPatient,
);

router.post("/book-appointment", authenticate, upload.single("prescription"), bookAppointment);
router.post("/:id/upload-prescription", authenticate, upload.single("prescription"), uploadPrescription);

router.get("/my-appointments", authenticate, getMyAppointments);
router.delete("/appointments/:id", authenticate, cancelAppointment);

router.get("/my-chat", authenticate, getOrCreateMyChat);
router.get("/chat-with-doctor/:doctorId", authenticate, getOrCreateDoctorChat);

module.exports = router;