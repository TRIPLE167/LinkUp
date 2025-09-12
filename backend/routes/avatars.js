const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const { v2: cloudinary } = require("cloudinary");
const User = require("../models/user");

const router = express.Router();

 
const upload = multer({ storage: multer.memoryStorage() });

 
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "linkup/avatars",
        overwrite: true,
        transformation: [
          { width: 256, height: 256, crop: "fill", gravity: "face" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

 
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!req.file) return res.status(400).json({ message: "file is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    user.avatar = result.secure_url;
    await user.save();

    return res
      .status(200)
      .json({ success: true, avatarUrl: result.secure_url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
});

 
router.post("/update", upload.single("file"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!req.file) return res.status(400).json({ message: "file is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

 
    if (user.avatar) {
      try {
        const publicId = user.avatar
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(`linkup/avatars/${publicId}`);
      } catch (err) {
        console.warn("Failed to delete old avatar:", err.message);
      }
    }

    const result = await uploadToCloudinary(req.file.buffer);
    user.avatar = result.secure_url;
    await user.save();

    return res
      .status(200)
      .json({ success: true, avatarUrl: result.secure_url });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({ message: error?.message || "Server error" });
  }
});

module.exports = router;
