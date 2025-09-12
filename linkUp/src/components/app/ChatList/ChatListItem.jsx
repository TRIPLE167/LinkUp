import "./ChatListItem.scss";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
export default function ChatListItem({
  chat,
  selectedChat,
  onSelect,
  currentUserId,
  onlineUsers,
  newMessagesCount,
}) {
  const [otherUser, setOtherUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState("");
 

  useEffect(() => {
    if (!chat.isGroup) {
      const foundUser = chat.users.find(
        (user) => user._id.toString() !== currentUserId.toString()
      );
      setOtherUser(foundUser);
    } else {
      setGroupInfo(chat.groupInfo);
    }
  }, [chat, currentUserId]);
 
  const isOnline = otherUser && onlineUsers?.[otherUser._id];

  const messageText = chat.lastMessage?.text;
  const trimmedMessage =
    messageText && messageText.length > 20
      ? messageText.substring(0, 20) + "..."
      : messageText;

  const isActive = selectedChat && chat._id === selectedChat._id;
  const isLastMessageFromOtherUser =
    chat.lastMessage?.sender?.toString() !== currentUserId.toString();
  return (
    <div
      className={`chat-list-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect()}
    >
      <div className="avatar-wrapper">
        {otherUser ? (
          <img
            src={otherUser?.avatar || "/images/default-avatar.png"}
            alt={otherUser?.userName || "Avatar"}
            className="avatar"
          />
        ) : (
          <img
            src={groupInfo.avatar || "/images/groupChat.jpg"}
            alt={"Avatar"}
            className="avatar"
          />
        )}
        {otherUser &&
          (isOnline ? (
            <span className="online-dot" title="Online"></span>
          ) : (
            <span className="offline-dot" title="Online"></span>
          ))}
      </div>

      <div className="info">
        <h4 className="name">
          {otherUser?.displayName ||
            (groupInfo?.name?.length > 30
              ? groupInfo.name.slice(0, 30) + "..."
              : groupInfo?.name) ||
            "Unknown User"}
        </h4>
        <div>
          <p>
            <span
              className={
                newMessagesCount[chat._id] > 0 && isLastMessageFromOtherUser
                  ? "unread-messages"
                  : ""
              }
            >
              {newMessagesCount[chat._id] > 1 ? (
                <span>
                  {newMessagesCount[chat._id] > 4
                    ? "4+ New Messages"
                    : `${newMessagesCount[chat._id]} New Messages`}
                </span>
              ) : (
                <span>{trimmedMessage || "Start a conversation"} </span>
              )}
            </span>
            {chat.lastMessage?.text && <span className="dot">.</span>}
            <span>
              {chat.lastMessage?.createdAt
                ? formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
