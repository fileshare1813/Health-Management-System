const express = require("express");
const fs = require("fs");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const upload = require("./middlewares/upload");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const ejs = require("ejs");
const sendEmail = require("./nodemailer");
const http = require("http");
const socketIo = require("socket.io");

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

const connectDB = require("./config/mongoose");
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const supportRoutes = require("./routes/supportRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Minimal CORS handling
app.use(cors());
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/feedback", feedbackRoutes);

app.get("/api/send-email", sendEmail);

app.post("/upload-file", upload.single("prescription"), (req, res) => {
  try {
    const url =
      req.file && (req.file.path || req.file.secure_url || req.file.url);
    return res.status(200).json({ fileUrl: url });
  } catch (err) {
    return res.status(500).json({ error: "Upload failed" });
  }
});

const PORT = process.env.PORT || 3000;

// Socket.io chat handler

connectDB()
  .then(() => {
    // configure EJS views
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    // view routes
    app.get("/", (req, res) => res.render("index"));
    app.get("/register", (req, res) => res.render("register"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/patient", (req, res) => res.render("patient"));
    app.get("/support", (req, res) => res.render("support"));

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
