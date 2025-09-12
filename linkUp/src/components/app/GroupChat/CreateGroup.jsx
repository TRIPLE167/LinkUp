import { useState, useEffect } from "react";
import SearchBar from "../ChatList/SearchBar";
import axios from "axios";

const CreateGroup = ({ showGroupChat, setShowGroupChat }) => {
  const [groupChatSearchTerm, setGroupChatSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mutualUsers, setMutualUsers] = useState([]);
  const currentUserId = localStorage.getItem("currentUserId");
  const [members, setMembers] = useState([currentUserId]);

  useEffect(() => {
    if (!showGroupChat) return;

    const fetchMutuals = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/users/mutuals?userId=${currentUserId}`
        );
        setMutualUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch mutuals:", err);
      }
    };

    fetchMutuals();
  }, [showGroupChat, currentUserId]);

  const filteredUsers = mutualUsers.filter((user) => {
    const search = groupChatSearchTerm
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    const fullText = `
      ${user.userName || ""}
      ${user.name || ""}
      ${user.lastName || ""}
    `
      .toLowerCase()
      .replace(/\s+/g, " ");

    return fullText.includes(search);
  });

  const handleMemberToggle = (userId) => {
    setMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((m) => m !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (members.length < 2) return;

    try {
      const res = await axios.post(
        "${import.meta.env.VITE_API_URL}/chats/group",
        {
          userIds: members,
        }
      );
      setErrorMessage("");
      setMembers([currentUserId]);
      setShowGroupChat(false);
    } catch (err) {
      console.error(
        "Failed to create group:",
        err.response?.data || err.message
      );

      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <>
      <div
        className="group-chat-container"
        style={{ display: showGroupChat ? "flex" : "none" }}
      >
        <div className="group-chat-header">
          <h5>Create group</h5>
          <button
            onClick={() => {
              setShowGroupChat(false);
              setMembers([currentUserId]);
              setErrorMessage("");
            }}
          >
            x
          </button>
          <SearchBar onSearch={setGroupChatSearchTerm} />
        </div>
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No mutual connections found.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isChecked = members.includes(user._id);
              return (
                <div
                  key={user._id}
                  className="user-result"
                  onClick={() => handleMemberToggle(user._id)}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <img
                      src={user.avatar || "/Bg.png"}
                      alt={user.userName || "Avatar"}
                    />
                    <div>
                      <h5>{user.displayName || user.userName}</h5>
                      <p>
                        {user.name} {user.lastName}
                      </p>
                    </div>
                  </div>
                  <input type="checkbox" checked={!!isChecked} readOnly />
                </div>
              );
            })
          )}
        </div>
        <p>{errorMessage}</p>
        <button
          disabled={members.length < 3}
          className="create"
          onClick={handleCreateGroup}
        >
          Create
        </button>
      </div>
      <div
        className="group-chat-background"
        style={{ display: showGroupChat ? "block" : "none" }}
        onClick={() => {
          setShowGroupChat(false);
          setMembers([currentUserId]);
          setErrorMessage("");
        }}
      ></div>
    </>
  );
};

export default CreateGroup;
