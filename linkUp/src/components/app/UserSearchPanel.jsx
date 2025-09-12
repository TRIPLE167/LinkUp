import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";

const UserSearchPanel = ({ isOpen, setIsOpen, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const LIMIT = 10;
  const [Skip, setSkip] = useState(0);
  const [areMoreUsers, setAreMoreUsers] = useState(true);
  const { onlineUsers } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setResults([]);
      setSkip(0);
      setAreMoreUsers(true);
    }
  }, [isOpen]);

  const fetchUsers = async (term, skip = 0) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search`,
        {
          params: { query: term, userId: currentUserId, skip, limit: LIMIT },
        }
      );

      if (res.data.length < LIMIT) {
        setAreMoreUsers(false);
      }

      const usersWithMutual = await Promise.all(
        res.data.map(async (user) => {
          if (user._id === currentUserId) return { ...user, mutual: false };

          try {
            const statusRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/users/follow-status`,
              { params: { followerId: currentUserId, followingId: user._id } }
            );
            return { ...user, mutual: statusRes.data.mutual };
          } catch {
            return { ...user, mutual: false };
          }
        })
      );

      setResults((prev) => [...prev, ...usersWithMutual]);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setSkip(0);
    setResults([]);
    setAreMoreUsers(true);

    if (term.trim().length > 0) {
      fetchUsers(term, 0);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() !== "" && Skip > 0) {
      fetchUsers(searchTerm, Skip);
    }
  }, [Skip]);

  return (
    <>
      <div className={`user-search-panel ${isOpen ? "open" : ""}`}>
        <div className="top-section">
          <div>
            <h2>Search</h2>
            <div className="input">
              <input
                type="text"
                placeholder="Search Users"
                value={searchTerm}
                onChange={handleSearch}
              />
              <div>
                <FaSearch className="icon" />
              </div>
            </div>
          </div>
        </div>

        <div
          className="users"
          onScroll={(e) => {
            const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
            if (scrollTop + clientHeight >= scrollHeight - 10 && areMoreUsers) {
              setSkip((prev) => prev + LIMIT);
            }
          }}
        >
          {results.length > 0
            ? results.map((user) => {
                const showOnlineStatus = user.mutual && onlineUsers?.[user._id];

                return (
                  <div
                    key={user._id}
                    className="user-result"
                    onClick={() => {
                      navigate(`/profile/${user.userName}`);
                      setIsOpen(false);
                    }}
                  >
                    <div className="avatar-wrapper">
                      <img src={user.avatar || "/Bg.png"} alt={user.userName} />
                      {user.mutual && (
                        <span
                          className={showOnlineStatus ? "online-dot" : ""}
                        ></span>
                      )}
                    </div>
                    <div>
                      <h4>{user.displayName}</h4>
                      <div className="name-lastname">
                        <p>{user.name}</p>
                        <p>{user.lastName}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            : searchTerm.trim() !== "" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <p>No users found.</p>
                </div>
              )}
        </div>
      </div>
      <div
        className={`background-button ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
      ></div>
    </>
  );
};

export default UserSearchPanel;
