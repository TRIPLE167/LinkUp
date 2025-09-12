const express = require("express");
const Chat = require("../models/Chat");
const User = require("../models/user");

module.exports = (io, usersToSockets) => {
  const router = express.Router();

 
  router.post("/", async (req, res) => {
    const { userIds } = req.body;

    if (!userIds || userIds.length < 2) {
      return res
        .status(400)
        .json({ message: "Need at least 2 users for a group chat" });
    }

    try {
 
      let chat = await Chat.findOne({
        isGroup: true,
        users: { $all: userIds, $size: userIds.length },
      });

      if (!chat) {
        const members = await User.find({ _id: { $in: userIds } }).select(
          "displayName"
        );
        const defaultGroupName = members
          .map((member) => member.displayName)
          .join(", ");
        chat = new Chat({
          users: userIds,
          isGroup: true,
          groupInfo: {
            name: defaultGroupName || "New Group",
            avatar: "/images/groupChat.png",
          },
        });

        await chat.save();
        await chat.populate("users", "userName displayName avatar");

 
        userIds.forEach((id) => {
          const socketId = usersToSockets.get(id);
          if (socketId) {
            io.to(socketId).emit("newGroupCreated", chat);
          }
        });
        res.status(201).json({ message: "success" });
      }

      res
        .status(400)
        .json({ message: "group with these users already exists" });
    } catch (err) {
      console.error("Error creating group chat:", err);
      res.status(500).json({ message: "Server error creating group chat" });
    }
  });

  router.get("/members", async (req, res) => {
    const GroupId = req.query.GroupId;
    try {
      if (!GroupId) {
        return res.json({ message: "Server error finding group chat" });
      }

      const chat = await Chat.findOne({ _id: GroupId }).populate(
        "users",
        "userName displayName avatar name lastName"
      );

      if (!chat) {
        return res.json({ message: "Server error finding group chat" });
      }

      res.status(200).json(chat);
    } catch (err) {
      console.log(err);
    }
  });

  router.put("/ChangeName", async (req, res) => {
    const GroupId = req.query.GroupId;
    const { groupName, currentUseId } = req.body;

    try {
      if (!GroupId || !groupName) {
        return res.status(400).json({ message: "group name cannot be empty" });
      }

      const chat = await Chat.findOne({ _id: GroupId });

      if (!chat) {
        return res.status(404).json({ message: "Group chat not found" });
      }
      let user = await User.findOne({ _id: currentUseId }).select(
        "name lastName"
      );
      let userName = `${user.name} ${user.lastName}`;
 
      chat.groupInfo.name = groupName;
      chat.groupInfo.defaultName = false;
      chat.groupInfo.setBy = userName;
      await chat.save();

 
      io.to(GroupId.toString()).emit("groupNameUpdated", {
        groupId: GroupId,
        groupName: groupName,
        userName: userName,
      });
      res.status(200).json({ message: "succsess " });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.put("/Leave", async (req, res) => {
    try {
      const GroupId = req.query.GroupId;
      const { currentUserId } = req.body;

      const chat = await Chat.findOne({ _id: GroupId });

      if (!chat) return res.status(400).send("Chat not found");

      chat.users = chat.users.filter(
        (userId) => userId.toString() !== currentUserId
      );
      await chat.save();

      return res.status(200).send("User removed from group");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
  });

  router.put("/addMembers", async (req, res) => {
    const { userIds, groupId } = req.body;

    if (!userIds || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Need at least 1 user to add to group" });
    }

    try {
      const chat = await Chat.findOne({
        isGroup: true,
        _id: groupId,
      });

      userIds.forEach((id) => {
        if (!chat.users.includes(id)) chat.users.push(id);
      });

      await chat.save();
      await chat.populate("users", "userName displayName avatar");

      userIds.forEach((id) => {
        const socketId = usersToSockets.get(id);
        if (socketId) {
          io.to(socketId).emit("AddedToGroup", chat);
        }
      });
      res.status(200).json({ message: "succsessfully added members" });
    } catch (err) {
      console.error("Error creating group chat:", err);
      res.status(500).json({ message: "Server error creating group chat" });
    }
  });

  return router;
};
