const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Support = require("../models/supportModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

// Creates a login-capable Support agent (User + Support profile), same pattern as Doctor creation.
async function createSupport(req, res) {
  let session;
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        error: "name, username, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase().trim() }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already in use" });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "support",
    });
    await user.save({ session });

    const support = new Support({
      name,
      email: email.toLowerCase().trim(),
      user: user._id,
    });
    await support.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ message: "Support agent created successfully", support });
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
      session.endSession();
    }
    return res.status(500).json({ error: err.message });
  }
}

// Chats visible to a support agent: everything still open (unclaimed) + chats already assigned to them
async function getMyChats(req, res) {
  try {
    const supportUserId = req.user.id;

    const chats = await Chat.find({
      $or: [{ status: "open" }, { "support.id": supportUserId }],
    })
      .sort({ lastUpdated: -1 })
      .select("-messages");

    return res.status(200).json({ chats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getChatMessages(req, res) {
  try {
    const { room } = req.params;
    const chat = await Chat.findOne({ room });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Only the assigned support agent (or nobody yet) can view an open chat's history
    if (
      chat.support &&
      chat.support.id &&
      String(chat.support.id) !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "This chat is assigned to another support agent" });
    }

    return res.status(200).json({ chat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Claim an open chat so it becomes assigned to the logged-in support agent
async function claimChat(req, res) {
  try {
    const { room } = req.params;
    const chat = await Chat.findOne({ room });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (
      chat.support &&
      chat.support.id &&
      String(chat.support.id) !== req.user.id
    ) {
      return res
        .status(409)
        .json({ error: "Chat already claimed by another support agent" });
    }

    chat.support = {
      id: req.user.id,
      identifier: req.user.username,
      name: req.user.username,
    };
    chat.status = "claimed";
    await chat.save();

    return res.status(200).json({ message: "Chat claimed", chat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createSupport, getMyChats, getChatMessages, claimChat };