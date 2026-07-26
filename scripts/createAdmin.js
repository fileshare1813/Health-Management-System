require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

async function run() {
  const [, , username, email, password] = process.argv;

  if (!username || !email || !password) {
    console.log(
      "Usage: node scripts/createAdmin.js <username> <email> <password>",
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    console.log("A user with that username or email already exists.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({
    username,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: "admin",
  });

  await admin.save();
  console.log("Admin user created:", admin.username);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});