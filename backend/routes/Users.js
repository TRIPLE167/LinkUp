const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

module.exports = (io, usersToSockets) => {
  router.get("/search", async (req, res) => {
    const { query, userId, skip = 0, limit = 10 } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    try {
      const regex = new RegExp(query.trim(), "i");

      const allUsers = await User.find({
        $or: [{ name: regex }, { lastName: regex }, { userName: regex }],
      })
        .select(
          "userName displayName avatar name lastName followersCount followingCount createdAt"
        )
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const followingDocs = await Follow.find({ followerId: userId }).select(
        "followingId"
      );
      const followingIds = followingDocs.map((f) => f.followingId.toString());

      const currentUserProfile = [];
      const followedUsers = [];
      const otherUsers = [];

      allUsers.forEach((user) => {
        const uid = user._id.toString();

        if (uid === userId) {
          currentUserProfile.push(user);
        } else if (followingIds.includes(uid)) {
          followedUsers.push(user);
        } else {
          otherUsers.push(user);
        }
      });

      const sortedUsers = [
        ...currentUserProfile,
        ...followedUsers,
        ...otherUsers,
      ];

      res.json(sortedUsers);
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/profile-info", async (req, res) => {
    const { query, userId } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    try {
      // Exact match by username
      const profileUser = await User.findOne({ userName: query.trim() }).select(
        "userName displayName avatar name lastName followersCount followingCount createdAt"
      );

      if (!profileUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get following list of current user
      const followingDocs = await Follow.find({ followerId: userId }).select(
        "followingId"
      );
      const followingIds = followingDocs.map((f) => f.followingId.toString());

      let relation = "other";
      if (profileUser._id.toString() === userId) {
        relation = "self";
      } else if (followingIds.includes(profileUser._id.toString())) {
        relation = "following";
      }

      // Check online status
      const isOnline = usersToSockets.has(profileUser._id.toString());

      res.json({ ...profileUser.toObject(), relation, isOnline });
    } catch (error) {
      console.error("Profile info error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/my-info", async (req, res) => {
    try {
      const userId = req.query.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      const objectId = new mongoose.Types.ObjectId(userId);

      const user = await User.findOne({ _id: objectId }).select(
        "userName displayName avatar name lastName email followersCount followingCount createdAt"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const notifications = await Notification.find({ userId: objectId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ user, notifications });
    } catch (error) {
      console.error("User info error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.post("/follow", async (req, res) => {
    try {
      const { followerId, followingId } = req.body;

      if (!followerId || !followingId) {
        return res
          .status(400)
          .json({ message: "followerId and followingId are required" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(followerId) ||
        !mongoose.Types.ObjectId.isValid(followingId)
      ) {
        return res.status(400).json({ message: "Invalid ObjectId(s)" });
      }

      if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }

      const newFollow = new Follow({ followerId, followingId });

      try {
        await newFollow.save();

        await Promise.all([
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
          User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }),
        ]);

        const followerUser = await User.findById(followerId).select(
          "name lastName userName displayName avatar"
        );

        if (followerUser) {
          const notificationMessage = `${followerUser.displayName} followed you.`;
          const notificationData = {
            type: "follow",
            text: notificationMessage,
            read: false,
            content: {
              _id: followerUser._id,
              userName: followerUser.displayName,
              avatar: followerUser.avatar,
            },
          };

          await Notification.findOneAndUpdate(
            {
              userId: followingId,
              type: "follow",
              "content._id": followerUser._id,
            },
            { $set: notificationData },
            { upsert: true, new: true }
          );

          const recipientSocketId = usersToSockets.get(followingId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit(
              "receiveNotification",
              notificationData
            );
          }
        }

        const followerSocketId = usersToSockets.get(followerId);
        const followingSocketId = usersToSockets.get(followingId);

        const payload = { followerId, followingId };

        if (followingSocketId) {
          io.to(followingSocketId).emit("userFollowed", payload);
        }

        if (followerSocketId) {
          io.to(followerSocketId).emit("userFollowed", payload);
        }

        return res.status(201).json({ success: true, follow: newFollow });
      } catch (saveError) {
        if (saveError.code === 11000) {
          return res
            .status(200)
            .json({ success: true, message: "Already following" });
        }
        throw saveError;
      }
    } catch (error) {
      console.error("Follow create error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.post("/unfollow", async (req, res) => {
    try {
      const { followerId, followingId } = req.body;

      if (!followerId || !followingId) {
        return res
          .status(400)
          .json({ message: "followerId and followingId are required" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(followerId) ||
        !mongoose.Types.ObjectId.isValid(followingId)
      ) {
        return res.status(400).json({ message: "Invalid ObjectId(s)" });
      }

      if (followerId === followingId) {
        return res
          .status(400)
          .json({ message: "You cannot unfollow yourself" });
      }

      const deleted = await Follow.findOneAndDelete({
        followerId,
        followingId,
      });

      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Follow relationship not found" });
      }

      await Promise.all([
        User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
        User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }),
      ]);

      const followerSocketId = usersToSockets.get(followerId);
      const followingSocketId = usersToSockets.get(followingId);

      const payload = { followerId, followingId };

      if (followingSocketId) {
        io.to(followingSocketId).emit("userUnfollowed", payload);
      }

      if (followerSocketId) {
        io.to(followerSocketId).emit("userUnfollowed", payload);
      }

      return res.json({ success: true, message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Unfollow error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/followers", async (req, res) => {
    const { userId, currentUserId, skip = 0, limit = 6 } = req.query;

    if (
      !userId ||
      !currentUserId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(currentUserId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid userId or currentUserId" });
    }

    try {
      const followers = await Follow.find({ followingId: userId })
        .populate("followerId", "userName displayName avatar name lastName")
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const followerUsers = followers.map((f) => f.followerId.toObject());

      const followingDocs = await Follow.find({
        followerId: currentUserId,
      }).select("followingId");
      const followingIds = followingDocs.map((f) => f.followingId.toString());

      const followersWithStatus = followerUsers.map((user) => ({
        ...user,
        isFollowing: followingIds.includes(user._id.toString()),
      }));

      res.json(followersWithStatus);
    } catch (error) {
      console.error("Get followers error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/following", async (req, res) => {
    const { userId, currentUserId, skip = 0, limit = 6 } = req.query;

    if (
      !userId ||
      !currentUserId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(currentUserId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid userId or currentUserId" });
    }

    try {
      const following = await Follow.find({ followerId: userId })
        .populate("followingId", "userName displayName avatar name lastName")
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const followingUsers = following.map((f) => f.followingId.toObject());

      const followingDocs = await Follow.find({
        followerId: currentUserId,
      }).select("followingId");
      const followingIds = followingDocs.map((f) => f.followingId.toString());

      const followingWithStatus = followingUsers.map((user) => ({
        ...user,
        isFollowing: followingIds.includes(user._id.toString()),
      }));

      res.json(followingWithStatus);
    } catch (error) {
      console.error("Get following error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/follow-status", async (req, res) => {
    try {
      const { followerId, followingId } = req.query;

      if (!followerId || !followingId) {
        return res
          .status(400)
          .json({ message: "followerId and followingId are required" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(followerId) ||
        !mongoose.Types.ObjectId.isValid(followingId)
      ) {
        return res.status(400).json({ message: "Invalid ObjectId(s)" });
      }

      const [aFollowsB, bFollowsA] = await Promise.all([
        Follow.exists({ followerId, followingId }),
        Follow.exists({ followerId: followingId, followingId: followerId }),
      ]);

      return res.json({
        following: Boolean(aFollowsB),
        followedBy: Boolean(bFollowsA),
        mutual: Boolean(aFollowsB && bFollowsA),
      });
    } catch (error) {
      console.error("Follow status error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/mutuals", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const following = await Follow.find({ followerId: userId }).select(
        "followingId"
      );
      const followingIds = following.map((f) => f.followingId.toString());

      const followers = await Follow.find({ followingId: userId }).select(
        "followerId"
      );
      const followerIds = followers.map((f) => f.followerId.toString());

      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      const mutualUsers = await User.find({ _id: { $in: mutualIds } }).select(
        "userName displayName name lastName avatar"
      );

      res.json(mutualUsers);
    } catch (err) {
      console.error("Error fetching mutuals:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.post("/notifications/mark-read-all", async (req, res) => {
    try {
      const userId = req.query.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );

      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  return router;
};
