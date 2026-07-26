const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/userController");
const validate = require("../utils/validate");

const router = express.Router();

router.post(
  "/register",
  validate([
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ]),
  register,
);

router.post(
  "/login",
  validate([
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  login,
);

module.exports = router;
