import { useState, useEffect } from "react";
import SearchBar from "../ChatList/SearchBar";
import axios from "axios";
import "./addMember.scss";

const AddMember = ({
  showAddMember,
  setShowAddMember,
  groupMembersIds,
  setGroupDetails,
  groupId,
}) => {
  const [groupChatSearchTerm, setGroupChatSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mutualUsers, setMutualUsers] = useState([]);
  const currentUserId = localStorage.getItem("currentUserId");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!showAddMember) return;  

    const fetchMutuals = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/users/mutuals?userId=${currentUserId}`
        );
        setMutualUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch mutuals:", err);
      }
    };

    fetchMutuals();
  }, [showAddMember, currentUserId]);

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

 
  const handleAddMembers = async () => {
    if (members.length === 0) return;

    try {
      const res = await axios.put(
        "http://localhost:3000/chats/group/addMembers",
        {
          userIds: members,
          groupId,
        }
      );
      if (res.status === 200) {
        setGroupDetails(false);
        setErrorMessage("");
        setMembers([]);
        setShowAddMember(false);
      }
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
        className="add-member-container"
        style={{ display: showAddMember ? "flex" : "none" }}
      >
        <div className="group-chat-header">
          <h5>Add People</h5>
          <button
            onClick={() => {
              setShowAddMember(false);
              setMembers([]);
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
                  className={
                    groupMembersIds.includes(user._id)
                      ? "user-result disabled"
                      : "user-result"
                  }
                  onClick={() => {
                    if (!groupMembersIds.includes(user._id))
                      handleMemberToggle(user._id);
                  }}
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
                  {groupMembersIds.includes(user._id) ? (
                    <p style={{ fontSize: "14px" }}>Member</p>
                  ) : (
                    <input type="checkbox" checked={!!isChecked} readOnly />
                  )}
                </div>
              );
            })
          )}
        </div>
        <p>{errorMessage}</p>
        <button
          disabled={members.length === 0}
          className="create"
          onClick={handleAddMembers}
        >
          Add
        </button>
      </div>
      <div
        className="add-member-bg"
        style={{ display: showAddMember ? "block" : "none" }}
        onClick={() => {
          setShowAddMember(false);
          setMembers([]);
          setErrorMessage("");
        }}
      ></div>
    </>
  );
};

export default AddMember;
