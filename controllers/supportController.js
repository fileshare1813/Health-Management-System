const Support = require("../models/supportModel");
const crypto = require("crypto");

async function createSupport(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email and password are required" });
    }

    const existing = await Support.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Simple hashing with sha256 for demonstration. Replace with bcrypt in production.
    const hashed = crypto.createHash("sha256").update(password).digest("hex");

    const support = new Support({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
    });

    await support.save();

    const out = support.toObject();
    delete out.password;

    return res.status(201).json({ message: "Support created", support: out });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createSupport };
