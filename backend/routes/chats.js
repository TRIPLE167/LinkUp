const express = require("express");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const mongoose = require("mongoose");
const groupRoutes = require("./groupRoutes");
 
module.exports = (io, usersToSockets) => {
  const router = express.Router();

  router.use("/group", groupRoutes(io, usersToSockets));
  
  router.get("/", async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ message: "Missing userId" });

      const objectId = new mongoose.Types.ObjectId(userId);

 
      const chats = await Chat.find({ users: objectId })
        .populate("users", "userName displayName name lastName avatar")
        .sort({ updatedAt: -1 });

      const chatsWithVisibleMessages = [];

      for (let chat of chats) {
        const lastMessage = await Message.findOne({ chatId: chat._id }).sort({
          createdAt: -1,
        });

 
        if (lastMessage || chat.isGroup) {
          chatsWithVisibleMessages.push({
            ...chat.toObject(),
            lastMessage: lastMessage || null, 
          });
        }
      }
 
      const unreadCounts = await Message.aggregate([
        {
          $match: {
            chatId: { $in: chatsWithVisibleMessages.map((c) => c._id) },
            readBy: { $ne: objectId },
            sender: { $ne: objectId },
          },
        },
        { $group: { _id: "$chatId", count: { $sum: 1 } } },
      ]);

      res.json({
        chats: chatsWithVisibleMessages,
        unreadCounts,
      });
    } catch (err) {
      console.error("❌ Error fetching chats:", err);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  router.post("/start", async (req, res) => {
    const { currentUserId, userId } = req.body;

    if (!currentUserId || !userId) {
      return res.status(400).json({ message: "Missing user IDs" });
    }

    try {
      let chat = await Chat.findOne({
        users: { $all: [currentUserId, userId], $size: 2 },
      }).populate("users", "userName displayName avatar");

      const isNewChat = !chat;

      if (isNewChat) {
        chat = new Chat({
          users: [currentUserId, userId],
        });
        await chat.save();
        await chat.populate("users", "userName displayName avatar");

 
        const recipientSocketId = usersToSockets.get(userId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("newChatCreated", chat);
         
         
        }
      }

      res.json(chat);
    } catch (err) {
      console.error("Error starting chat:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/:chatId", async (req, res) => {
    try {
      const chatId = req.params.chatId;

      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }

      const chat = await Chat.findById(chatId)
        .populate("lastMessage")
        .populate("users", "userName displayName avatar");

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.json(chat);
    } catch (err) {
      console.error("❌ Error fetching single chat:", err);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  return router; 
};
