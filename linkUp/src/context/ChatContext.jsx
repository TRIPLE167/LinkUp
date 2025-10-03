import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";
import axios from "axios";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY =
  "BKZr1975wWKBjxgCEuL3yJWnVEjnqUGLko9BiclcBLiK5WG4Wa3R2p9Hq1USu1MYTRLvMR7fTA4vpl7d-_GLgd0";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const currentUserId = localStorage.getItem("currentUserId");

  const [socket, setSocket] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [newMessagesCount, setNewMessagesCount] = useState({});
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [textAreaPlaceHolder, setTextAreaPlaceHolder] = useState();
  const [followEvents, setFollowEvents] = useState(0);
  const selectedChatRef = useRef(null);
  const chatsRef = useRef([]);
  const acknowledgedUsersRef = useRef(new Set());
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/my-info`,
          {
            params: { userId: currentUserId },
          }
        );
        setCurrentUser(res.data.user);
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    if (currentUserId) fetchUserInfo();
  }, [currentUserId]);

  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "SET_USER_ID",
            userId: currentUserId,
          });
        }
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    if ("serviceWorker" in navigator && "PushManager" in window) {
      const subscribeUser = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/serviceWorker.js"
          );
          const permission = await Notification.requestPermission();

          if (permission === "granted") {
            const existingSubscription =
              await registration.pushManager.getSubscription();

            if (existingSubscription) {
              await axios.post(`${import.meta.env.VITE_API_URL}/subscribe`, {
                subscription: existingSubscription,
                userId: currentUserId,
              });
              return;
            }

            const newSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            await axios.post(`${import.meta.env.VITE_API_URL}/subscribe`, {
              subscription: newSubscription,
              userId: currentUserId,
            });
          }
        } catch (error) {
          console.error("Failed to subscribe the user:", error);
        }
      };

      subscribeUser();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("groupNameUpdated", (data) => {
      const { groupId, groupName, userName } = data;

      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat._id === groupId) {
            return {
              ...chat,
              groupInfo: {
                ...chat.groupInfo,
                name: groupName,
                setBy: userName,
              },
            };
          }

          return chat;
        });

        return updatedChats;
      });

      if (selectedChat && selectedChat._id === groupId) {
        setSelectedChat((prevSelected) => ({
          ...prevSelected,
          groupInfo: {
            ...prevSelected.groupInfo,
            name: groupName,
            setBy: userName,
          },
        }));
      }
    });

    return () => {
      socket.off("groupNameUpdated");
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    if (!currentUserId) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}`);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("addUser", currentUserId);
      const fetchChatsAndJoin = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/chats`, {
            params: { userId: currentUserId },
          });

          const { chats: allChats, unreadCounts } = res.data;

          setChats(allChats);

          const countMap = {};
          allChats.forEach((chat) => {
            const unread = unreadCounts.find((uc) => uc._id === chat._id);
            countMap[chat._id] = unread ? unread.count : 0;
          });
          setNewMessagesCount(countMap);

          const allChatIds = allChats.map((chat) => chat._id);
          newSocket.emit("joinAllChats", allChatIds);
        } catch (err) {
          console.error("Error fetching chats:", err);
          setChats([]);
          setNewMessagesCount({});
          newSocket.emit("joinAllChats", []);
        }
      };

      fetchChatsAndJoin();
    });

    newSocket.on("newChatCreated", (newChatFromServer) => {
      newSocket.emit("joinAllChats", [newChatFromServer._id]);
    });

    newSocket.on("newGroupCreated", (newGroup) => {
      newSocket.emit("joinAllChats", [newGroup._id]);

      setChats((prevChats) => {
        const exists = prevChats.some((chat) => chat._id === newGroup._id);
        if (exists) return prevChats;
        return [newGroup, ...prevChats];
      });

      setNewMessagesCount((prev) => ({
        ...prev,
        [newGroup._id]: 0,
      }));
    });

    newSocket.on("AddedToGroup", (newGroup) => {
      newSocket.emit("joinAllChats", [newGroup._id]);

      setChats((prevChats) => {
        const exists = prevChats.some((chat) => chat._id === newGroup._id);
        if (exists) return prevChats;

        return [newGroup, ...prevChats];
      });

      setNewMessagesCount((prev) => ({
        ...prev,
        [newGroup._id]: 0,
      }));
    });

    newSocket.on("receiveMessage", async (newMessage) => {
      if (!newMessage || !newMessage.chatId) return;

      const chatExists = chatsRef.current.some(
        (chat) => chat._id === newMessage.chatId
      );

      if (chatExists) {
        if (!window.location.pathname.includes("/home")) {
          setNewMessagesCount((prev) => ({
            ...prev,
            [newMessage.chatId]: (prev[newMessage.chatId] || 0) + 1,
          }));
        } else {
          if (selectedChatRef.current?._id !== newMessage.chatId) {
            setNewMessagesCount((prev) => ({
              ...prev,
              [newMessage.chatId]: (prev[newMessage.chatId] || 0) + 1,
            }));
          }
        }

        setChats((prevChats) => {
          const chatIndex = prevChats.findIndex(
            (chat) => chat._id === newMessage.chatId
          );
          const updatedChat = {
            ...prevChats[chatIndex],
            lastMessage: newMessage,
            updatedAt: newMessage.createdAt,
          };
          return [
            updatedChat,
            ...prevChats.slice(0, chatIndex),
            ...prevChats.slice(chatIndex + 1),
          ];
        });
      } else {
        try {
          if (selectedChatRef.current?._id !== newMessage.chatId) {
            setNewMessagesCount((prev) => ({
              ...prev,
              [newMessage.chatId]: (prev[newMessage.chatId] || 0) + 1,
            }));
          }

          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/chats/${newMessage.chatId}`
          );
          setChats((prev) => [res.data, ...prev]);
        } catch (err) {
          console.error("Error fetching new chat for message:", err);
        }
      }

      const currentChat = selectedChatRef.current;
      if (currentChat && currentChat._id === newMessage.chatId) {
        setMessages((prevMessages) => {
          const isDuplicate = prevMessages.some(
            (msg) => msg._id === newMessage._id
          );
          if (!isDuplicate) return [...prevMessages, newMessage];
          return prevMessages;
        });
        if (window.location.pathname.includes("/home")) {
          newSocket.emit("messageSeen", {
            messageId: newMessage._id,
            userId: currentUserId,
          });
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (newNotification) => {
      setNotifications((prev) => {
        const filtered = prev.filter(
          (n) =>
            !(
              n.type === newNotification.type &&
              n.content?._id === newNotification.content?._id
            )
        );

        return [newNotification, ...filtered];
      });
    };

    socket.on("receiveNotification", handleNotification);

    return () => {
      socket.off("receiveNotification", handleNotification);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleUserUnfollowed = ({ followerId, followingId }) => {
      const chat = selectedChatRef.current;
      const user = currentUserRef.current;
      if (!chat || !user) return;

      const otherUserId = chat.users.find((u) => u._id !== user._id)?._id;

      if (otherUserId === followerId) {
        setCanSendMessage(false);
        setTextAreaPlaceHolder(
          `${
            chat.users.find((u) => u._id === otherUserId)?.userName
          } unfollowed you`
        );
      } else if (otherUserId === followingId) {
        setCanSendMessage(false);
        setTextAreaPlaceHolder(
          `You must follow ${
            chat.users.find((u) => u._id === otherUserId)?.userName
          }`
        );
      }
      setFollowEvents((prev) => (prev += 1));
    };

    const handleUserFollowed = ({ followerId, followingId }) => {
      const chat = selectedChatRef.current;
      const user = currentUserRef.current;
      if (!chat || !user) return;

      const otherUserId = chat.users.find((u) => u._id !== user._id)?._id;

      if (otherUserId === followerId) {
        setCanSendMessage(true);
      } else if (otherUserId === followingId) {
        setCanSendMessage(true);
      }

      setFollowEvents((prev) => prev + 1);
    };

    setFollowEvents((prev) => (prev += 1));

    socket.on("userUnfollowed", handleUserUnfollowed);
    socket.on("userFollowed", handleUserFollowed);

    return () => {
      socket.off("userUnfollowed", handleUserUnfollowed);
      socket.off("userFollowed", handleUserFollowed);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("userOnline", (userId) => {
      setOnlineUsers((prev) => {
        if (!acknowledgedUsersRef.current.has(userId)) {
          socket.emit("userOnline", { currentUserId, userId });
          acknowledgedUsersRef.current.add(userId);
        }
        return { ...prev, [userId]: true };
      });
    });

    socket.on("userOffline", (userId) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
      acknowledgedUsersRef.current.delete(userId);
    });

    return () => {
      socket.off("userOnline");
      socket.off("userOffline");
    };
  }, [socket, currentUserId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:seen", ({ messageId, readBy }) => {
      setMessages((prevMessages) => {
        let found = false;
        const updated = prevMessages.map((msg) => {
          if (msg._id.toString() === messageId.toString()) {
            found = true;

            return { ...msg, readBy };
          }
          return msg;
        });

        if (!found) {
          console.warn(
            "[WARN] message:seen for message not in state yet:",
            messageId
          );
        }

        return updated;
      });
    });

    socket.on("messages:updated", ({ chatId, userId }) => {
      setMessages((prevMessages) => {
        const updated = prevMessages.map((msg) =>
          msg.chatId === chatId &&
          msg.sender !== userId &&
          !msg.readBy.includes(userId)
            ? { ...msg, readBy: [...msg.readBy, userId] }
            : msg
        );
        return updated;
      });
    });

    return () => {
      socket.off("message:seen");
      socket.off("messages:updated");
    };
  }, [socket]);

  useEffect(() => {
    if (selectedChat?._id) {
      socket.emit("chatOpened", {
        chatId: selectedChat._id,
        userId: currentUserId,
      });
      setNewMessagesCount((prev) => ({
        ...prev,
        [selectedChat?._id]: 0,
      }));
    }
  }, [selectedChat, socket, currentUserId, window.location.pathname]);

  const loadOlderMessages = async () => {
    if (!messages.length) return;

    const oldest = messages[0].createdAt;
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/chats/${
        selectedChat._id
      }/messages?limit=15&before=${oldest}`
    );

    setMessages((prev) => [...res.data.reverse(), ...prev]);
  };

  const onSelectChat = async (chat) => {
    setSelectedChat(chat);

    setNewMessagesCount((prev) => ({
      ...prev,
      [chat._id]: 0,
    }));

    if (!chat || !chat._id) return;

    try {
      const otherUserId = chat.users.find((u) => u._id !== currentUserId)?._id;

      let placeholder = "Type a message...";
      let canSend = false;
      if (otherUserId) {
        const followRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/Users/follow-status`,
          { params: { followerId: currentUserId, followingId: otherUserId } }
        );

        const { following: isFollowing, followedBy: isFollowedBy } =
          followRes.data;
        if (isFollowedBy && isFollowing) {
          canSend = true;
        } else if (!isFollowedBy && !isFollowing) {
          canSend = false;
          placeholder = `You must follow each other to chat`;
        } else if (!isFollowedBy) {
          canSend = false;
          placeholder = `${
            chat.users.find((u) => u._id === otherUserId)?.userName
          } unfollowed you`;
        } else if (!isFollowing) {
          canSend = false;
          placeholder = `You must follow ${
            chat.users.find((u) => u._id === otherUserId)?.userName
          }   `;
        }
      }

      setCanSendMessage(canSend);
      setTextAreaPlaceHolder(placeholder);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/chats/${chat._id}/messages?limit=15`
      );
      setMessages(res.data.reverse());

      const newUrl = `/home/${chat._id}`;
      window.history.replaceState({ chatId: chat._id }, "", newUrl);
    } catch (err) {
      console.error("Error selecting chat:", err);
      setMessages([]);
      setCanSendMessage(false);
      setTextAreaPlaceHolder("Cannot send message");
    }
  };

  const joinChatRoom = (chatIds) => {
    if (!socket) return;
    const ids = Array.isArray(chatIds) ? chatIds : [chatIds];
    socket.emit("joinAllChats", ids);
  };

  const value = {
    socket,
    selectedChat,
    chats,
    messages,

    currentUser,
    onlineUsers,
    notifications,
    newMessagesCount,
    canSendMessage,
    textAreaPlaceHolder,
    followEvents,

    setMessages,
    setCurrentUser,
    setNotifications,
    setChats,

    setSelectedChat,
    onSelectChat,
    joinChatRoom,
    loadOlderMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
