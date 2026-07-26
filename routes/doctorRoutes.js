const express = require("express");
const { body } = require("express-validator");
const {
  createDoctor,
  getDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const validate = require("../utils/validate");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/", getDoctors);
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
  ]),
  createDoctor,
);

module.exports = router;