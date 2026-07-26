const express = require("express");
const { body } = require("express-validator");
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  getMyDoctorAppointments,
} = require("../controllers/doctorController");
const validate = require("../utils/validate");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/", getDoctors);

router.get(
  "/my-appointments",
  authenticate,
  authorize("doctor"),
  getMyDoctorAppointments,
);

router.get("/:id", getDoctorById);

router.post(
  "/add-doctor",
  authenticate,
  authorize("admin"),
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("specialisation")
      .notEmpty()
      .withMessage("Specialisation is required"),
    body("degree").notEmpty().withMessage("Degree is required"),
    body("fees").isNumeric().withMessage("Fees must be a number"),
    body("experience").isNumeric().withMessage("Experience must be a number"),
    body("username").notEmpty().withMessage("Username is required for doctor login"),
    body("email").isEmail().withMessage("Valid email is required for doctor login"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  createDoctor,
);

module.exports = router;