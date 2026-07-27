const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const sendEmail = require("./nodemailer");
const http = require("http");
const socketIo = require("socket.io");

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const connectDB = require("./config/mongoose");
const upload = require("./middlewares/upload");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const registerChatSocket = require("./sockets/chatSocket");

const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const supportRoutes = require("./routes/supportRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Socket.io chat handler — JWT authenticated, persisted to MongoDB
registerChatSocket(io);

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    app.get("/", (req, res) => res.render("index"));
    app.get("/register", (req, res) => res.render("register"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/patient", (req, res) => res.render("patient"));
    app.get("/doctors", (req, res) => res.render("doctors"));
    app.get("/my-appointments", (req, res) => res.render("my-appointments"));
    app.get("/admin", (req, res) => res.render("admin"));
    app.get("/doctor-dashboard", (req, res) => res.render("doctor-dashboard"));
    app.get("/support", (req, res) => res.render("support"));
    app.get("/patient-chat", (req, res) => res.render("patient-chat"));
    app.get("/doctor-chat", (req, res) => res.render("doctor-chat"));

    app.use(notFound);
    app.use(errorHandler);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });