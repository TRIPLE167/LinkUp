import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.scss";
import { useChat } from "../../../context/ChatContext";
import Sidebar from "../SideBar";
import UserInfo from "./UserInfo";
export default function Profile() {
  const navigate = useNavigate();
  const { userName } = useParams();
  const { notifications, currentUser, followEvents } = useChat();
  const [activeTab, setActiveTab] = useState("about");
  const [isLoading, setIsLoading] = useState(true);
  const [userInfoUpdate, setUserInfoUpdate] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [wantsUnfollow, setWantsUnfollow] = useState(false);
  const [userToBeUnfollowed, setUserToBeUnfollowed] = useState(null);
  const [error, setError] = useState("");
  const [currentUserCheck, setcurrentUserCheck] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 500);
  const [followStatus, setFollowStatus] = useState({
    following: false,
    followedBy: false,
    mutual: false,
  });

  const normalizedUserName = useMemo(
    () => (userName ? String(userName).trim().toLowerCase() : ""),
    [userName]
  );

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 500);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (currentUser._id?.toString() === profileData?._id.toString()) {
      setcurrentUserCheck(true);
    } else {
      setcurrentUserCheck(false);
    }
  }, [profileData]);

  const handleFollow = async (followingId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/follow`, {
        followerId: currentUser._id,
        followingId,
      });

      setUserInfoUpdate(null);

      if (followingId === profileData._id) {
        setProfileData((prev) => ({
          ...prev,
          followersCount: (prev?.followersCount || 0) + 1,
        }));

        const statusRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/follow-status`,
          {
            params: {
              followerId: currentUser._id,
              followingId: profileData._id,
            },
          }
        );
        setFollowStatus(
          statusRes.data || {
            following: true,
            followedBy: false,
            mutual: false,
          }
        );
      }
    } catch (error) {
      console.error("Follow request failed:", error);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/chats/start`,
        {
          currentUserId: currentUser._id,
          userId: profileData._id,
        }
      );
      const chat = res.data;
      navigate("/home", { state: { openChat: chat } });
    } catch (e) {
      console.error("Failed to start chat:", e);
    }
  };

  const handleUnfollow = async (followingId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users/unfollow`, {
        followerId: currentUser._id,
        followingId,
      });

      if (followingId === profileData._id) {
        setProfileData((prev) => ({
          ...prev,
          followersCount: Math.max((prev?.followersCount || 1) - 1, 0),
        }));

        const statusRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/follow-status`,
          {
            params: {
              followerId: currentUser._id,
              followingId: profileData._id,
            },
          }
        );
        setFollowStatus(
          statusRes.data || {
            following: false,
            followedBy: false,
            mutual: false,
          }
        );
      }
    } catch (error) {
      console.error("Unfollow request failed:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError("");
      try {
        let res;
        if (normalizedUserName === currentUser.userName.toLowerCase()) {
          res = await axios.get(
            `${import.meta.env.VITE_API_URL}/users/my-info`,
            {
              params: { userId: currentUser._id },
            }
          );
          setProfileData(res.data.user);
        } else {
          res = await axios.get(
            `${import.meta.env.VITE_API_URL}/users/search`,
            {
              params: { query: userName, userId: currentUser._id },
            }
          );
          const exactMatch = (res.data || []).find(
            (u) => String(u.userName).toLowerCase() === normalizedUserName
          );
          setProfileData(exactMatch || null);
          setUserToBeUnfollowed(exactMatch || null);
        }
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?._id) fetchProfile();
  }, [normalizedUserName, currentUser]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!profileData?._id || !currentUser._id) return;
      if (String(currentUser._id) === String(profileData._id)) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/follow-status`,
          {
            params: {
              followerId: currentUser._id,
              followingId: profileData._id,
            },
          }
        );
        setFollowStatus(
          res.data || { following: false, followedBy: false, mutual: false }
        );
      } catch (e) {
        setFollowStatus({ following: false, followedBy: false, mutual: false });
      }
    };
    fetchFollowStatus();
  }, [currentUser._id, profileData?._id, notifications, followEvents]);

  return (
    <>
      <div className="profile-container">
        <Sidebar />
        <div className="profile-page">
          <div className="top-section">
            <div className="top-left">
              <div>
                <img
                  src={profileData?.avatar || "asd"}
                  alt={profileData?.userName || "avatar"}
                />
                <div>
                  <h1>
                    {profileData?.name} {profileData?.lastName}
                  </h1>
                  <p>@{profileData?.displayName}</p>
                  <h5>
                    <span>
                      <span>{profileData?.followersCount}</span> followers
                    </span>
                    <span>
                      <span>{profileData?.followingCount}</span> following
                    </span>
                  </h5>
                </div>
              </div>
            </div>
            {currentUserCheck ? (
              <button className="edit" onClick={() => navigate("/settings")}>
                Settings
              </button>
            ) : followStatus.mutual ? (
              <div>
                <button
                  className="unfollow"
                  onClick={() => handleUnfollow(profileData._id)}
                >
                  UnFollow
                </button>
                <button className="message" onClick={handleMessage}>
                  Message
                </button>
              </div>
            ) : followStatus.following ? (
              <button
                className="requested"
                onClick={() => setWantsUnfollow(true)}
              >
                Requested
              </button>
            ) : followStatus.followedBy ? (
              <button
                className="follow-back"
                onClick={() => handleFollow(profileData._id)}
              >
                Follow Back
              </button>
            ) : (
              <button
                className="follow"
                onClick={() => handleFollow(profileData._id)}
              >
                Follow
              </button>
            )}
          </div>
          <div
            className="about-container"
            style={{
              minHeight:
                isSmallScreen &&
                (activeTab === "followers" || activeTab === "following")
                  ? "460px"
                  : "auto",
            }}
          >
            <div className="buttons">
              <button
                className={activeTab === "about" ? "focused" : ""}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
              <button
                className={activeTab === "followers" ? "focused" : ""}
                onClick={() => setActiveTab("followers")}
              >
                Followers
              </button>
              <button
                className={activeTab === "following" ? "focused" : ""}
                onClick={() => setActiveTab("following")}
              >
                Following
              </button>
            </div>
            <UserInfo
              profileData={profileData}
              followStatus={followStatus}
              currentUserId={currentUser._id}
              handleFollow={handleFollow}
              info={activeTab}
              setInfo={setActiveTab}
              setWantsUnfollow={setWantsUnfollow}
              setUserToBeUnfollowed={setUserToBeUnfollowed}
              userInfoUpdate={userInfoUpdate}
            />
          </div>
        </div>
      </div>

      {wantsUnfollow && (
        <>
          <div className="unfollow-container">
            <div>
              <img
                src={userToBeUnfollowed?.avatar || profileData?.avatar}
                alt=""
              />
              <p>{userToBeUnfollowed?.userName || profileData?.userName}</p>
              <button
                onClick={() => {
                  setWantsUnfollow(false);
                  setUserToBeUnfollowed(null);
                }}
              >
                x
              </button>
            </div>
            <button
              onClick={() => {
                handleUnfollow(userToBeUnfollowed._id || profileData._id);
                setUserToBeUnfollowed(null);
                setUserInfoUpdate(userToBeUnfollowed?._id);
                setWantsUnfollow(false);
              }}
            >
              Unfollow
            </button>
          </div>
          <div
            className="unfollow-container-background"
            onClick={() => {
              setWantsUnfollow(false);
              setUserToBeUnfollowed(null);
            }}
          ></div>
        </>
      )}
    </>
  );
}
