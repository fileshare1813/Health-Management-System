const express = require("express");
const { body } = require("express-validator");
const {
  createSupport,
  getMyChats,
  getChatMessages,
  claimChat,
} = require("../controllers/supportController");
const validate = require("../utils/validate");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

// Only an admin can create new support agents
router.post(
  "/add-support",
  authenticate,
  authorize("admin"),
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  createSupport,
);

router.get("/my-chats", authenticate, authorize("support"), getMyChats);
router.get(
  "/chats/:room/messages",
  authenticate,
  authorize("support"),
  getChatMessages,
);
router.post(
  "/chats/:room/claim",
  authenticate,
  authorize("support"),
  claimChat,
);

module.exports = router;