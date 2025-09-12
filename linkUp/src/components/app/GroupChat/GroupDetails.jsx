import React from "react";
import "./GroupDetails.scss";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddMember from "./AddMember";
import axios from "axios";

import { useChat } from "../../../context/ChatContext";
const GroupDetails = ({ groupInfo, isSmallScreen, setGroupDetails }) => {
  const currentUserId = localStorage.getItem("currentUserId");
  const [members, setMembers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [wantsChangeName, setWantsChangeName] = useState(false);
  const { setSelectedChat, setChats } = useChat();

  const [groupNameInput, setGroupNameInput] = useState(
    groupInfo.groupInfo.name.length > 30
      ? `${groupInfo.groupInfo.name.slice(0, 30)}...`
      : groupInfo.groupInfo.name
  );

  const navigate = useNavigate();
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/chats/group/members?GroupId=${
            groupInfo._id
          }`
        );

        setMembers(response.data.users);
      } catch (err) {
        console.log(err);
      }
    };
    fetchMembers();
  }, [groupInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (groupNameInput.length > 20) {
      return setErrorMessage("The name must not exceed 20 characters.");
    }
    try {
      let normalizedName = groupNameInput.trim();
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/chats/group/ChangeName?GroupId=${
          groupInfo._id
        }`,
        { groupName: normalizedName, currentUseId: currentUserId }
      );

      setWantsChangeName(false);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to change group name."
      );
      console.log(err);
    }
  };

  const leaveGroup = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/chats/group/Leave?GroupId=${
          groupInfo._id
        }`,
        { currentUserId }
      );
      if (response.status === 200) {
        setChats((prev) => prev.filter((chat) => chat._id !== groupInfo._id));
        setSelectedChat(null);
        navigate("/home");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to Leave group");
      console.log(err);
    }
  };
  return (
    <>
      <div className="group-details">
        <div className="details">
          {isSmallScreen && (
            <button
              onClick={() => {
                setGroupDetails(false);
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
          <p>Details</p>
        </div>
        <div className="Edit">
          <p>Change group name</p>
          <button onClick={() => setWantsChangeName(true)}>Change</button>
        </div>
        <div className="members">
          <div className="edit-members">
            <h3>Members</h3>
            <button onClick={() => setShowAddMember(true)}>Add People</button>
          </div>
          <div>
            {members.map((member) => (
              <div
                className="single-member"
                key={member._id}
                onClick={() => navigate(`/profile/${member.userName}`)}
              >
                <img src={member.avatar} alt="avatar" />
                <div>
                  <h4>{member.displayName}</h4>
                  <p>
                    {member.name} {member.lastName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="leave">
          <button onClick={leaveGroup}>Leave group</button>
        </div>
      </div>

      <div
        className="change-groupname"
        style={{ display: wantsChangeName ? "flex" : "none" }}
      >
        <div className="top">
          <button onClick={() => setWantsChangeName(false)}>X</button>
          <h5>Change group name</h5>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input">
            <p>Changing the name of a group chat changes it for everyone.</p>
            <input
              type="text"
              onChange={(e) => {
                setGroupNameInput(e.target.value);
              }}
              value={groupNameInput}
            />
            <h6>{errorMessage}</h6>
          </div>

          <div className="button">
            <button
              type="submit"
              disabled={
                groupNameInput === groupInfo.groupInfo.name ||
                !groupNameInput.trim()
              }
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <div
        className="change-groupname-bg"
        style={{ display: wantsChangeName ? "block" : "none" }}
        onClick={() => setWantsChangeName(false)}
      ></div>

      {showAddMember && (
        <AddMember
          showAddMember={showAddMember}
          setShowAddMember={setShowAddMember}
          groupMembersIds={members.map((member) => member._id)}
          groupId={groupInfo._id}
          setGroupDetails={setGroupDetails}
        />
      )}
    </>
  );
};

export default GroupDetails;
