const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./models/db");
const nodemailer = require("nodemailer");
const cors = require("cors");
const User = require("./models/user");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const messageRoutes = require("./routes/messages");
const webpush = require("web-push");

require("dotenv").config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
connectDB();
app.use(cors());

const usersToSockets = new Map();
const chatRoutes = require("./routes/chats")(io, usersToSockets);
app.use("/chats", chatRoutes);
app.use("/chats/:chatId/messages", messageRoutes);

const userRoutes = require("./routes/Users")(io, usersToSockets);
app.use("/users", userRoutes);

const avatarRoutes = require("./routes/avatars");
app.use("/avatars", avatarRoutes);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

webpush.setVapidDetails(
  `mailto:${process.env.GMAIL_USER}`,
  "BKZr1975wWKBjxgCEuL3yJWnVEjnqUGLko9BiclcBLiK5WG4Wa3R2p9Hq1USu1MYTRLvMR7fTA4vpl7d-_GLgd0",
  "uChGc16CPw-dIMtT2mQuypqbFZddTislMpverHJ0g8w"
);

app.post("/subscribe", async (req, res) => {
  const { subscription, userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subscription = subscription;
    await user.save();

    res.status(201).json({ message: "Subscription saved successfully" });
  } catch (err) {
    console.error("[SUBSCRIPTION ERROR] Error saving subscription:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  const { name, lastName, email, password } = req.body;

  try {
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.verified) {
        return res.status(400).json({ message: "User already exists" });
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (
        !existingUser.lastResendAt ||
        existingUser.lastResendAt < oneHourAgo
      ) {
        existingUser.resendCount = 0;
      }

      if (existingUser.resendCount >= 3) {
        return res.status(429).json({
          message: "Resend limit reached. Try again later.",
        });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiration = new Date(Date.now() + 60 * 1000);

      existingUser.verificationCode = newCode;
      existingUser.verificationCodeExpiresAt = newExpiration;
      existingUser.resendCount += 1;
      existingUser.lastResendAt = now;

      await existingUser.save();

      const mailOptions = {
        from: "LinkUp <linkupl675@gmail.com>",
        to: email,
        subject: "LinkUp Verification Code",
        text: `Hello ${existingUser.name}, \n\nTo complete your request, please enter the following verification code: ${newCode}`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        message: "User already registered but not verified. New code sent.",
        expirationDate: newExpiration,
      });
    }

    const generateCode = () =>
      Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCode = generateCode();

    const expirationDate = new Date(Date.now() + 60 * 1000);
    const newUser = new User({
      name,
      lastName,
      email,
      password,
      verificationCode,
      verificationCodeExpiresAt: expirationDate,
    });

    await newUser.save();

    const mailOptions = {
      from: "LinkUp <linkupl675@gmail.com>",
      to: email,
      subject: "LinkUp Verification Code",
      text: `Hello ${name},  \n\nPlease use this code to complete your registration: ${verificationCode} \n\nIf you didn't request this, please ignore this message.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: "User registered. Verification code sent.",
      expirationDate: expirationDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      user.verificationCode = null;
      await user.save();
      return res.status(400).json({ message: "Verification code expired" });
    }

    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.resendCount = null;
    user.lastResendAt = null;
    await user.save();

    res.json({ message: "User verified successfully", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (!user.lastResendAt || user.lastResendAt < oneHourAgo) {
      user.resendCount = 0;
    }

    if (user.resendCount >= 3) {
      return res
        .status(429)
        .json({ message: "Resend limit reached. Try again later." });
    }

    const generateCode = () =>
      Math.floor(100000 + Math.random() * 900000).toString();
    const newCode = generateCode();
    const expirationDate = new Date(Date.now() + 60 * 1000);

    user.verificationCode = newCode;
    user.verificationCodeExpiresAt = expirationDate;
    user.resendCount += 1;
    user.lastResendAt = now;

    await user.save();

    const mailOptions = {
      from: "LinkUp <linkupl675@gmail.com>",
      to: email,
      subject: "LinkUp Verification Code",
      text: `Hello ${user.name}, \n\nTo complete your request, please enter the following verification code: ${newCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: "New verification code sent",
      expirationDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/username", async (req, res) => {
  try {
    const { username, displayName, email } = req.body;

    const exists = await User.findOne({ userName: username });

    if (exists) {
      return res.status(409).json({
        message: "Username is already taken",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.userName = username;
    user.displayName = displayName;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Username set successfully",
    });
  } catch (error) {
    console.error("Set username error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.verified) {
      return res.status(403).json({ message: "User email not verified" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.verified) {
      return res
        .status(200)
        .json({ message: "If this email exists, a reset code has been sent." });
    }

    const newResetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    user.resetCode = newResetCode;
    user.resetCodeExpiresAt = expirationTime;

    await user.save();

    const mailOptions = {
      from: "LinkUp <linkupl675@gmail.com>",
      to: normalizedEmail,
      subject: "LinkUp Verification Code",
      text: `Hello ${user.name}, \n\nWe received a request to reset your password. \n\nTo complete the process, enter the following code on the password reset page: ${newResetCode} \n\nThis code is only valid for the next 10 minutes. \n\nIf you didn't request a password reset, please ignore this message. Your password remains unchanged.`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "If this email exists, a reset code has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error, try again later." });
  }
});

app.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (
      !user ||
      !user.resetCode ||
      user.resetCode !== code ||
      !user.resetCodeExpiresAt ||
      user.resetCodeExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return res.status(500).json({ message: "Server error, try again later." });
  }
});

app.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: "Both fields are required." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

app.post("/login-verify", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (!user.lastResendAt || user.lastResendAt < oneHourAgo) {
      user.resendCount = 0;
    }

    if (user.resendCount >= 3) {
      return res
        .status(429)
        .json({ message: "Resend limit reached. Try again later." });
    }

    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const newCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    user.verificationCode = newCode;
    user.verificationCodeExpiresAt = expiresAt;
    user.resendCount += 1;
    user.lastResendAt = new Date();
    await user.save();

    const mailOptions = {
      from: "LinkUp <linkupl675@gmail.com>",
      to: email,
      subject: "LinkUp Verification Code",
      text: `Hello ${user.name}, \n\nTo complete your request, please enter the following verification code: ${newCode}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Verification code sent again.",
      expirationDate: expiresAt,
    });
  } catch (error) {
    console.error("Login verify error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

const cleanUpUnverifiedUsers = async () => {
  const expirationThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const result = await User.deleteMany({
      verified: false,
      createdAt: { $lt: expirationThreshold },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
  }
};

setInterval(() => {
  cleanUpUnverifiedUsers();
}, 12 * 60 * 60 * 1000);

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    usersToSockets.set(userId, socket.id);
    socket.userId = userId;
  });

  socket.on("joinAllChats", async (chatIds) => {
    const userId = socket.userId;

    for (const chatId of chatIds) {
      socket.join(chatId);

      try {
        const chat = await Chat.findById(chatId).populate("users", "_id");

        chat.users.forEach((participant) => {
          const participantId = participant._id.toString();

          if (participantId !== userId) {
            const otherSocketId = usersToSockets.get(participantId);
            if (otherSocketId) {
              io.to(otherSocketId).emit("userOnline", userId);
            }
          }
        });
      } catch (err) {
        console.error("Error fetching chat participants:", err);
      }
    }
  });

  socket.on("userOnline", async (data) => {
    const { currentUserId, userId } = data;
    const socketId = usersToSockets.get(userId);
    io.to(socketId).emit("userOnline", currentUserId);
  });

  socket.on("typing", (data) => {
    const { chatId, _id, avatar } = data;
    socket.to(chatId).emit("typing", { _id, avatar });
  });

  socket.on("stopTyping", (data) => {
    const { chatId, _id } = data;
    socket.to(chatId).emit("stopTyping", { _id });
  });

  socket.on("sendMessage", async (messageData) => {
    try {
      const newMessage = new Message(messageData);
      await newMessage.save();
      await Chat.findByIdAndUpdate(messageData.chatId, {
        lastMessage: newMessage._id,
        updatedAt: new Date(),
      });

      io.to(messageData.chatId).emit("receiveMessage", newMessage);

      const chat = await Chat.findById(messageData.chatId).populate("users");

      const offlineUsers = chat.users.filter((user) => {
        const isOffline = !usersToSockets.has(user._id.toString());
        const isNotSender = user._id.toString() !== messageData.sender;

        return isNotSender && isOffline;
      });

      for (const user of offlineUsers) {
        if (user.subscription) {
          const payload = JSON.stringify({
            title: "LinkUp",
            body: `new message from ${messageData.senderName}!`,
            icon: messageData.senderAvatar,
            data: {
              chatId: messageData.chatId,
              sender: messageData.sender,
            },
          });

          webpush
            .sendNotification(user.subscription, payload)

            .catch((err) => {
              console.error(
                `[PUSH_ERROR] Error sending notification to user ${user._id}:`,
                err
              );
            });
        }
      }
    } catch (error) {
      console.error(
        `[SEND_MESSAGE_ERROR] An unexpected error occurred:`,
        error
      );
    }
  });

  socket.on("chatOpened", async ({ chatId, userId }) => {
    try {
      const unreadMessages = await Message.find({
        chatId,
        readBy: { $ne: userId },
        sender: { $ne: userId },
      }).sort({ createdAt: 1 });

      if (unreadMessages.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadMessages.map((msg) => msg._id) } },
          { $addToSet: { readBy: userId } }
        );

        io.to(chatId).emit("messages:updated", {
          chatId,
          userId,
        });
      }
    } catch (error) {
      console.error("Error handling chatOpened event:", error);
    }
  });

  socket.on("messageSeen", async (data) => {
    const { messageId, userId } = data;

    try {
      const updatedMessage = await Message.findOneAndUpdate(
        {
          _id: messageId,
          sender: { $ne: userId },
        },
        {
          $addToSet: { readBy: userId },
        },
        { new: true }
      );

      if (!updatedMessage) {
        return;
      }

      io.to(updatedMessage.chatId.toString()).emit("message:seen", {
        messageId: updatedMessage._id,
        readBy: updatedMessage.readBy,
      });
    } catch (error) {
      console.error("Error handling messageSeen event:", error);
    }
  });

  socket.on("disconnecting", () => {
    const disconnectedUserId = socket.userId;
    if (!disconnectedUserId) return;
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("userOffline", disconnectedUserId);
      }
    }
  });

  socket.on("disconnect", () => {
    for (let [key, value] of usersToSockets.entries()) {
      if (value === socket.id) {
        usersToSockets.delete(key);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {});
