const express = require("express");
const { body } = require("express-validator");
const {
  createFeedback,
  getPositiveFeedback,
  getFeedbackByDoctor,
} = require("../controllers/feedbackController");
const validate = require("../utils/validate");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/add-feedback",
  authenticate,
  validate([
    body("doctorId").notEmpty().withMessage("Doctor ID is required"),
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("rating")
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be between 0 and 5"),
    body("comment").notEmpty().withMessage("Comment is required"),
  ]),
  createFeedback,
);

router.get("/positive", getPositiveFeedback);
router.get("/doctor/:doctorId", getFeedbackByDoctor);

module.exports = router;