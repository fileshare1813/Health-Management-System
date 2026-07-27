const socketAuth = require("../middlewares/socketAuth");
const Chat = require("../models/chatModel");
const Doctor = require("../models/doctorModel");

async function isParticipant(chat, user) {
  if (!chat) return false;

  if (chat.type === "support") {
    if (user.role === "support") {
      // Any support agent may enter an unclaimed chat; a claimed chat is theirs only
      if (!chat.support || !chat.support.id) return true;
      return String(chat.support.id) === String(user.id);
    }
    if (user.role === "patient") {
      return chat.room === `chat_${user.id}`;
    }
    return false;
  }

  if (chat.type === "doctor") {
    if (user.role === "patient") {
      return chat.patient && String(chat.patient.id) === String(user.id);
    }
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ user: user.id });
      if (!doctorProfile) return false;
      return chat.room.startsWith(`doctor_${doctorProfile._id}_patient_`);
    }
    return false;
  }

  return false;
}

function registerChatSocket(io) {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.user.role}:${socket.user.username})`);

    socket.on("joinRoom", async ({ room }) => {
      try {
        if (!room) return;

        let chat = await Chat.findOne({ room });

        // Patients lazily create their own support-chat room the first time they join
        if (!chat && socket.user.role === "patient" && room === `chat_${socket.user.id}`) {
          chat = new Chat({
            chatKey: room,
            room,
            type: "support",
            patient: { id: socket.user.id, identifier: socket.user.username, name: socket.user.username },
            status: "open",
          });
          await chat.save();
        }

        if (!chat) {
          socket.emit("error message", "Chat not found. Start it from the app first.");
          return;
        }

        const allowed = await isParticipant(chat, socket.user);
        if (!allowed) {
          socket.emit("error message", "You are not authorized to join this room");
          return;
        }

        // First support agent to open an unclaimed support chat auto-claims it
        if (chat.type === "support" && socket.user.role === "support" && (!chat.support || !chat.support.id)) {
          chat.support = { id: socket.user.id, identifier: socket.user.username, name: socket.user.username };
          chat.status = "claimed";
          await chat.save();
        }

        socket.join(room);
        socket.currentRoom = room;

        socket.emit("chat history", chat.messages);
        io.to(room).emit("system message", {
          text: `${socket.user.username} (${socket.user.role}) joined the chat`,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("joinRoom failed:", err.message);
        socket.emit("error message", "Could not join room");
      }
    });

    socket.on("chat message", async ({ room, message }) => {
      try {
        if (!room || !message || !message.trim()) return;
        if (socket.currentRoom !== room) {
          socket.emit("error message", "Join the room before sending messages");
          return;
        }

        const chat = await Chat.findOne({ room });
        const allowed = await isParticipant(chat, socket.user);
        if (!chat || !allowed) {
          socket.emit("error message", "You are not authorized to send to this room");
          return;
        }

        const chatMessage = {
          senderRole: socket.user.role,
          senderId: socket.user.id,
          senderIdentifier: socket.user.username,
          senderName: socket.user.username,
          message: message.trim(),
          metadata: {},
          createdAt: new Date(),
        };

        chat.messages.push(chatMessage);
        chat.lastUpdated = new Date();
        await chat.save();

        io.to(room).emit("chat message", chatMessage);
      } catch (err) {
        console.error("chat message failed:", err.message);
        socket.emit("error message", "Message could not be sent");
      }
    });

    socket.on("typing", ({ room }) => {
      if (room && socket.currentRoom === room) {
        socket.to(room).emit("typing", {
          userId: socket.user.id,
          username: socket.user.username,
          role: socket.user.role,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

module.exports = registerChatSocket;