const express = require("express");
const router = express.Router({ mergeParams: true });
const Message = require("../models/Message"); 

 
module.exports = router;

 
 
router.get("/", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 15, before } = req.query;  

    const query = { chatId };

    if (before) {
 
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) 
      .limit(Number(limit));

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});
 
router.post("/", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sender, text } = req.body;

    const newMessage = new Message({
      chatId,
      sender,
      text,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ message: "Server error" });
  }
});
