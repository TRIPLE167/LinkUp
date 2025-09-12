// models/Message.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Chat",
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
