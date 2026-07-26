const express = require("express");
const { body } = require("express-validator");
const { createSupport } = require("../controllers/supportController");
const validate = require("../utils/validate");

const router = express.Router();

router.post(
  "/add-support",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  createSupport,
);

module.exports = router;
