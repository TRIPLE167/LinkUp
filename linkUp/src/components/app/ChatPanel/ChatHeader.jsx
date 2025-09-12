import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function ChatHeader({
  info,
  onlineUsers,
  groupDetails,
  setGroupDetails,
  setMessages,
  setSelectedChat,
}) {
  if (!info) return null;

  const navigate = useNavigate();
  const [trimmedName, setTrimmedName] = useState(info.groupInfo?.name);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 501);
  const isUser = !info.isGroup;
  const isOnline = isUser ? onlineUsers?.[info._id] : false;

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 501);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isUser && info.groupInfo?.name) {
      if (info.groupInfo.name.length > 20) {
        setTrimmedName(info.groupInfo.name.slice(0, 20) + "...");
      } else {
        setTrimmedName(info.groupInfo.name);
      }
    }
  }, [info, isUser]);

  const handleClick = () => {
    if (isUser) {
      navigate(`/profile/${info.userName}`);
    } else {
      setGroupDetails((prev) => !prev);
    }
  };

  return (
    <div className="chat-header">
      <div>
        {isSmallScreen && (
          <button
            className="return"
            onClick={() => {
              setSelectedChat(null);
              setMessages([]);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}
        <div className="chat-info" onClick={handleClick}>
          <div className="avatar-wrapper">
            <img
              src={
                isUser
                  ? info.avatar || "/images/Bg.png"
                  : info.groupInfo?.avatar || "/images/groupChat.jpg"
              }
              alt={
                isUser
                  ? info.userName || "Avatar"
                  : info.groupInfo?.name || "Group Avatar"
              }
              className="avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = isUser
                  ? "/images/Bg.png"
                  : "/images/groupChat.jpg";
              }}
            />
            {isUser &&
              (isOnline ? (
                <span className="online-dot" title="Online"></span>
              ) : (
                <span className="offline-dot" title="Offline"></span>
              ))}
          </div>
          <div className="info">
            <h4>{isUser ? info.displayName : trimmedName}</h4>
            {!isUser && !info.groupInfo?.defaultName && (
              <p>set by {info.groupInfo?.setBy} </p>
            )}
          </div>
        </div>
      </div>
      {!isUser && (
        <button
          className={groupDetails ? "open" : ""}
          onClick={() => setGroupDetails((prev) => !prev)}
        >
          <InformationCircleIcon />
        </button>
      )}
    </div>
  );
}
