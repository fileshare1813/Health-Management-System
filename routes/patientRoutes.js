const express = require("express");
const { body } = require("express-validator");
const {
  createPatient,
  bookAppointment,
  uploadPrescription,
} = require("../controllers/patientController");
const validate = require("../utils/validate");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/add-patient",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("age").isNumeric().withMessage("Age must be a number"),
    body("address").notEmpty().withMessage("Address is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("ailment").notEmpty().withMessage("Ailment is required"),
  ]),
  createPatient,
);

router.post(
  "/book-appointment",
  upload.single("prescription"),
  bookAppointment,
);

// Upload prescription for an existing patient (multipart/form-data, field name: `prescription`)
router.post(
  "/:id/upload-prescription",
  upload.single("prescription"),
  uploadPrescription,
);

module.exports = router;
