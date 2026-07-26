const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    chatIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Chat",
      default: [],
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
