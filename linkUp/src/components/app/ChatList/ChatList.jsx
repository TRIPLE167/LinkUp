// ChatList.jsx
import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import ChatListItem from "./ChatListItem";
import "./ChatList.scss";
import CreateGroup from "../GroupChat/CreateGroup";
import { useChat } from "../../../context/ChatContext";

export default function ChatList({}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const currentUserId = localStorage.getItem("currentUserId");
  const { chats, onSelectChat, selectedChat, onlineUsers, newMessagesCount } =
    useChat();

  const chatsWithMessages = chats.filter(
    (chat) => chat.lastMessage || chat.isGroup
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredChats = chatsWithMessages.filter((chat) => {
    const otherUser = chat.users.find(
      (user) => user._id.toString() !== currentUserId.toString()
    );

    return otherUser?.userName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <div
        className="chat-list"
        style={window.innerWidth <= 600 ? { height: windowHeight } : {}}
      >
        <div className="search-and-new">
          <SearchBar onSearch={setSearchTerm} />
          <button onClick={() => setShowGroupChat(true)}>
            <img src="/images/Edit.png" alt="" />
          </button>
        </div>
        <div className="chats">
          <h3>Messages</h3>
          <div className="chat">
            {filteredChats.length === 0 ? (
              <div className="no-chats">No chats found.</div>
            ) : (
              filteredChats.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  currentUserId={currentUserId}
                  selectedChat={selectedChat}
                  onlineUsers={onlineUsers}
                  onSelect={() => onSelectChat(chat)}
                  newMessagesCount={newMessagesCount}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <CreateGroup
        showGroupChat={showGroupChat}
        setShowGroupChat={setShowGroupChat}
      />
    </>
  );
}
