const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupInfo: {
      name: {
        type: String,
        default: "new group",
      },
      avatar: {
        type: String,
        default: "/images/groupChat.png",
      },
      setBy: {
        type: String,
        default: "",
      },
      defaultName: {
        type: Boolean,
        default: true,
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
