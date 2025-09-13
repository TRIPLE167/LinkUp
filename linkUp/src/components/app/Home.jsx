import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import HomeSideBar from "./SideBar";
import ChatList from "./ChatList/ChatList";
import "../../styles/Home.scss";
import ChatPanel from "./ChatPanel/ChatPanel";
import { useChat } from "../../context/ChatContext";

const Home = () => {
  const location = useLocation();
  const { onSelectChat, joinChatRoom, selectedChat } = useChat();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 501);

  useEffect(() => {
    const state = location.state;
    if (state && state.openChat) {
      const chat = state.openChat;
      joinChatRoom([chat._id]);
      onSelectChat(chat);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 501);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="Home-container">
      {isSmallScreen ? (
        selectedChat ? (
          <></>
        ) : (
          <HomeSideBar />
        )
      ) : (
        <>
          <HomeSideBar />
        </>
      )}
      <div className="panel-list">
        {isSmallScreen ? (
          selectedChat ? (
            <ChatPanel />
          ) : (
            <ChatList />
          )
        ) : (
          <>
            <ChatList />
            <ChatPanel />
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
