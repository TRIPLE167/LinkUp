// MessageInput.jsx
import { useState, useEffect, useRef } from "react";
import "./ChatPanel.scss";
import { useChat } from "../../../context/ChatContext";
export default function MessageInput({
  onSend,
  socket,
  chat,
  currentUser,
  inputRef,
}) {
  const [message, setMessage] = useState("");
  const [buttonClass, setButtonClass] = useState("");
  const { canSendMessage, textAreaPlaceHolder } = useChat();
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 680);

  useEffect(() => {
    if (message != "") {
      setButtonClass("visible");
    } else setButtonClass("");
  }, [message]);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 680);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTyping = () => {
    if (!isTypingRef.current) {
      socket.emit("typing", {
        chatId: chat._id,
        _id: currentUser._id,
        avatar: currentUser.avatar,
      });
      isTypingRef.current = true;
    }

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: chat._id,
        _id: currentUser._id,
      });
      isTypingRef.current = false;
    }, 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      if (isTypingRef.current) {
        clearTimeout(typingTimer.current);
        socket.emit("stopTyping", {
          chatId: chat._id,
          _id: currentUser._id,
        });
        isTypingRef.current = false;
      }

      inputRef.current.focus();
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <textarea
        value={message}
        disabled={!canSendMessage}
        style={{
          paddingRight: !canSendMessage ? "0" : "70px",
        }}
        placeholder={textAreaPlaceHolder}
        ref={inputRef}
        onChange={(e) => {
          setMessage(e.target.value);
          e.target.scrollTop = e.target.scrollHeight;
          handleTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        rows={1}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
      />
      <button className={buttonClass} type="submit">
        Send
      </button>
    </form>
  );
}
