const express = require("express");
const { body } = require("express-validator");
const { createDoctor } = require("../controllers/doctorController");
const validate = require("../utils/validate");

const router = express.Router();

router.post(
  "/add-doctor",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("specialisation").notEmpty().withMessage("Specialisation is required"),
    body("degree").notEmpty().withMessage("Degree is required"),
    body("fees").isNumeric().withMessage("Fees must be a number"),
    body("experience").isNumeric().withMessage("Experience must be a number"),
  ]),
  createDoctor,
);

module.exports = router;
