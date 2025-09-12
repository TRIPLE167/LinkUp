import "./ChatPanel.scss";
import React, { useEffect, useRef, useLayoutEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
export default function MessageList({
  messages,
  loadOlderMessages,
  chat,
  typingUsers,
}) {
  const currentUserId = localStorage.getItem("currentUserId");
  const prevScrollHeightRef = useRef(0);
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const navigate = useNavigate();
  const getUser = (userId) => chat?.users?.find((user) => user._id === userId);

 
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
 
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      if (container.scrollTop === 0 && loadOlderMessages && !isLoadingOlder) {
        prevScrollHeightRef.current = container.scrollHeight;
        setIsLoadingOlder(true); 
        await loadOlderMessages();
        setIsLoadingOlder(false);  
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadOlderMessages, isLoadingOlder]);

  
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current) {
      const newScrollHeight = container.scrollHeight;

 
      requestAnimationFrame(() => {
        container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        prevScrollHeightRef.current = 0;
      });
    }
  }, [messages]);

 
  const getLastSeenByMap = () => {
    const lastSeen = {};
    const readers =
      chat?.users?.filter((user) => user._id !== currentUserId) || [];

    const lastSentIndexByUser = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (lastSentIndexByUser[msg.sender] === undefined) {
        lastSentIndexByUser[msg.sender] = i;
      }
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      for (const reader of readers) {
        const lastSentIndex = lastSentIndexByUser[reader._id];
        if (
          msg.readBy.includes(reader._id) &&
          !lastSeen[reader._id] &&
          (lastSentIndex === undefined || i > lastSentIndex)
        ) {
          lastSeen[reader._id] = msg._id;
        }
      }
    }

    return lastSeen;
  };

  const lastSeenMap = getLastSeenByMap();

  return (
    <div className="message-list" ref={containerRef}>
      {/* Loading indicator at top */}
      {isLoadingOlder && (
        <div className="loading-older">
          <div className="spiner"></div>
        </div>
      )}

      {messages.length > 0 ? (
        messages.map((msg, index) => {
          const sender = getUser(msg.sender);
          const isCurrentUser = msg.sender === currentUserId;

          const readersOnThisMessage =
            chat?.users?.filter(
              (user) =>
                lastSeenMap[user._id] === msg._id && user._id !== currentUserId
            ) || [];

          return (
            <React.Fragment key={msg._id}>
              <div className={`message ${isCurrentUser ? "sent" : "received"}`}>
                <div className="img-text">
                  {!isCurrentUser && sender?.avatar && (
                    <img
                      onClick={() => navigate(`/profile/${sender.userName}`)}
                      src={sender.avatar}
                      alt="avatar"
                      className="message-avatar"
                    />
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
              {readersOnThisMessage.length > 0 && (
                <div className="read-receipts">
                  {readersOnThisMessage.length > 4 && (
                    <span className="more-readers">
                      +{readersOnThisMessage.length - 4}
                    </span>
                  )}
                  {readersOnThisMessage.slice(0, 4).map((reader) => (
                    <img
                      key={reader._id}
                      src={reader.avatar || "/images/Bg.png"}
                      alt={`${reader.name || "User"} read`}
                      className="read-avatar"
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })
      ) : (
        <div className="no-message">No messages yet. Say hello!</div>
      )}

      <div className="typing-indicator">
        {typingUsers
          .filter((typer) => chat?.users?.some((u) => u._id === typer._id))
          .map((typer) => (
            <div className="typing-user" key={typer._id}>
              <img src={typer.avatar} alt="typing user" />
              <div>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ))}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
