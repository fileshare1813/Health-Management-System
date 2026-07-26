const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["patient", "support"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    senderIdentifier: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ParticipantSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "patient.onModel",
    },
    identifier: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    onModel: {
      type: String,
      enum: ["user"],
      default: "user",
    },
  },
  { _id: false },
);

const ChatSchema = new mongoose.Schema(
  {
    chatKey: {
      type: String,
      required: true,
      unique: true,
    },
    room: {
      type: String,
      required: true,
      index: true,
    },
    patient: {
      type: ParticipantSchema,
      required: false,
    },
    support: {
      type: ParticipantSchema,
      required: false,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const ChatModel = mongoose.model("Chat", ChatSchema);

module.exports = ChatModel;
