import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useChat } from "../../../context/ChatContext";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "./ChatPanel.scss";
import GroupDetails from "../GroupChat/GroupDetails";

export default function ChatPanel({}) {
  const {
    selectedChat: chat,
    messages,
    onlineUsers,
    socket,
    currentUser,
    onSelectChat,
    loadOlderMessages,
    setMessages,
    setSelectedChat,
  } = useChat();
  const inputRef = useRef();
  const currentUserId = localStorage.getItem("currentUserId");
  const [groupDetails, setGroupDetails] = useState(false);
  const [localChat, setLocalChat] = useState(chat);
  const [localMessages, setLocalMessages] = useState(messages);
  const [otherUser, setOtherUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 970);
  const location = useLocation();
  const pathSegments = location.pathname.split("/");
  const chatIdFromUrl = pathSegments[pathSegments.length - 1];

  const [panelHeight, setPanelHeight] = useState();

  // This is the new useEffect hook you requested to fix the iOS keyboard issue.
  useEffect(() => {
    // Check if the browser supports visualViewport, which is key for iOS.
    if (window.visualViewport) {
      const handleResize = () => {
        // If the message input ref exists, get the new viewport height
        if (inputRef.current) {
          const newHeight = window.visualViewport.height;
          // Set the panel's height to the new, smaller viewport height.
          setPanelHeight(`${newHeight}px`);
        }
      };

      const handleFocus = () => {
        // Attach the resize listener when the input is focused (keyboard appears).
        window.visualViewport.addEventListener("resize", handleResize);
        // Call it immediately to handle the initial state.
        handleResize();
      };

      const handleBlur = () => {
        // Remove the listener when the input is blurred (keyboard disappears).
        window.visualViewport.removeEventListener("resize", handleResize);
        // Reset the panel height to its default value.
        setPanelHeight("100dvh");
      };

      const inputElement = inputRef.current;
      if (inputElement) {
        inputElement.addEventListener("focusin", handleFocus);
        inputElement.addEventListener("focusout", handleBlur);
      }

      // Cleanup function to remove event listeners on component unmount.
      return () => {
        if (inputElement) {
          inputElement.removeEventListener("focusin", handleFocus);
          inputElement.removeEventListener("focusout", handleBlur);
        }
        window.visualViewport.removeEventListener("resize", handleResize);
      };
    }
  }, []);
  

  useEffect(() => {
    setLocalChat(chat);
    setLocalMessages(messages);
  }, [chat, messages]);

  useEffect(() => {
    setGroupDetails(false);
  }, [chat]);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 970);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!chat && chatIdFromUrl && chatIdFromUrl !== "home") {
      setIsLoading(true);
      const fetchChat = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/chats/${chatIdFromUrl}`
          );
          onSelectChat(res.data);
        } catch (err) {
          console.error("Error fetching chat data from URL:", err);
          setLocalChat(null);
          setLocalMessages([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchChat();
    }
  }, [chat, chatIdFromUrl]);

  useEffect(() => {
    if (!localChat) return;

    if (!localChat.isGroup) {
      const other = localChat.users?.find(
        (user) => user._id.toString() !== currentUserId.toString()
      );
      setOtherUser(other || null);
      setGroupInfo(null);
    } else {
      setOtherUser(null);
      setGroupInfo(localChat);
    }
  }, [localChat, currentUserId]);

  useEffect(() => {
    if (!socket || !localChat) return;

    const handleTyping = (typer) => {
      setTypingUsers((prev) => {
        if (!prev.some((user) => user._id === typer._id))
          return [...prev, typer];
        return prev;
      });
    };

    const handleStopTyping = (typer) => {
      setTypingUsers((prev) => prev.filter((user) => user._id !== typer._id));
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, localChat]);

  if (isLoading) {
    return (
      <div className="chat-panel loading">
        <p>Loading chat...</p>
      </div>
    );
  }

  if (!localChat) {
    return (
      <div className="chat-panel empty">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  if (!localChat.isGroup && !otherUser) {
    return (
      <div className="chat-panel loading">
        <p>Loading chat user data...</p>
      </div>
    );
  }

  const handleSendMessage = (messageText) => {
    if (messageText.trim()) {
      const newMessage = {
        chatId: localChat._id,
        sender: currentUserId,
        senderName: currentUser.displayName,
        senderAvatar: currentUser.avatar,
        text: messageText.trim(),
        createdAt: new Date(),
      };
      socket.emit("sendMessage", newMessage);
    }
  };

  return (
    <div
      className="chat-panel"
      style={{
        height: window.innerWidth < 500 ? panelHeight : "",
      }}
    >
      <div
        className="chat"
        style={{ opacity: isSmallScreen && groupDetails ? 0 : 1 }}
      >
        <ChatHeader
          info={otherUser || groupInfo}
          onlineUsers={onlineUsers}
          groupDetails={groupDetails}
          setSelectedChat={setSelectedChat}
          setGroupDetails={setGroupDetails}
          setMessages={setMessages}
        />
        <MessageList
          messages={localMessages}
          loadOlderMessages={loadOlderMessages}
          chat={localChat}
          typingUsers={typingUsers}
        />
        <MessageInput
          onSend={handleSendMessage}
          socket={socket}
          chat={localChat}
          currentUser={currentUser}
          inputRef={inputRef}
        />
      </div>
      {groupDetails && (
        <GroupDetails
          groupInfo={groupInfo}
          setGroupDetails={setGroupDetails}
          isSmallScreen={isSmallScreen}
        />
      )}
    </div>
  );
}
