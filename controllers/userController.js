const User = require("../models/userModel");
const crypto = require("crypto");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

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

    // Hash password with SHA256 (production: use bcrypt)
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });
    await user.save();

    return res
      .status(201)
      .json({ message: "User registered successfully", userId: user._id });
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

    // Hash provided password and compare
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session or JWT
    req.session = req.session || {};
    req.session.userId = user._id;
    req.session.username = user.username;

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login };
