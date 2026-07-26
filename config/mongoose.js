const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment variables. Add it to a .env file or set it in your environment.");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected");
});

module.exports = connectDB;
