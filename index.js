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
const Chat = require("./models/chatModel");

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

// Socket.io chat handler (with MongoDB persistence)
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", async ({ room, userId, role }) => {
    if (!room) return;
    socket.join(room);
    console.log(`Socket ${socket.id} (${role || "user"}) joined room ${room}`);

    // Send existing chat history to the client that just joined
    try {
      const chat = await Chat.findOne({ chatKey: room });
      if (chat) {
        socket.emit("chat history", chat.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err.message);
    }
  });

  socket.on("chat message", async (payload) => {
    if (typeof payload === "string") {
      io.emit("chat message", payload);
      return;
    }

    const {
      room,
      senderType,
      senderId,
      senderIdentifier,
      senderName,
      receiverType,
      receiverId,
      receiverIdentifier,
      message,
      metadata,
    } = payload;

    const chat = {
      room,
      senderType,
      senderId,
      senderIdentifier,
      senderName: senderName || senderIdentifier,
      receiverType,
      receiverId,
      receiverIdentifier,
      message,
      metadata: metadata || {},
      timestamp: new Date(),
    };

    if (room) {
      io.to(room).emit("chat message", chat);

      try {
        await Chat.findOneAndUpdate(
          { chatKey: room },
          {
            $setOnInsert: { chatKey: room, room },
            $push: {
              messages: {
                senderRole: senderType,
                senderIdentifier,
                senderName: senderName || senderIdentifier,
                message,
                metadata: metadata || {},
              },
            },
            $set: { lastUpdated: new Date() },
          },
          { upsert: true, new: true },
        );
      } catch (err) {
        console.error("Failed to persist chat message:", err.message);
      }
    } else {
      io.emit("chat message", chat);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");

    // app.get("/", (req, res) => res.redirect("/login"));
    app.get("/", (req, res) => res.render("index"));
    app.get("/register", (req, res) => res.render("register"));
    app.get("/login", (req, res) => res.render("login"));
    app.get("/patient", (req, res) => res.render("patient"));
    app.get("/doctors", (req, res) => res.render("doctors"));
    app.get("/my-appointments", (req, res) => res.render("my-appointments"));
    app.get("/admin", (req, res) => res.render("admin"));
    app.get("/support", (req, res) => res.render("support"));
    

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