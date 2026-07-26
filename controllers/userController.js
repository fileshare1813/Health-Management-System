const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Public registration can only create "patient" accounts.
    // Doctor / support / admin accounts should be created separately.
    const allowedPublicRoles = ["patient"];
    const finalRole = allowedPublicRoles.includes(role) ? role : "patient";

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: finalRole,
    });
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login };