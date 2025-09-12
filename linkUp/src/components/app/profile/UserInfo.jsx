import { useEffect, useState } from "react";
import "./UserInfo.scss";
import { format } from "date-fns";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserInfo = ({
  profileData,
  followStatus,
  currentUserId,
  info,
  setInfo,
  handleFollow,
  setUserToBeUnfollowed,
  userInfoUpdate,
  setWantsUnfollow,
}) => {
  const isCurrentUser = profileData?._id === currentUserId;

  if (!profileData) {
    return null;
  }

  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);
  const LIMIT = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [followersSkip, setFollowersSkip] = useState(0);
  const [followingSkip, setFollowingSkip] = useState(0);

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      try {
        if (info === "followers") {
          const res = await axios.get("http://localhost:3000/users/followers", {
            params: {
              userId: profileData._id,
              currentUserId,
              skip: followersSkip,
              limit: LIMIT,
            },
          });

          if (res.data.length < LIMIT) setHasMoreFollowers(false);
          setFollowers((prev) => [...prev, ...res.data]);
        } else if (info === "following") {
          const res = await axios.get("http://localhost:3000/users/following", {
            params: {
              userId: profileData._id,
              currentUserId,
              skip: followingSkip,
              limit: LIMIT,
            },
          });

          if (res.data.length < LIMIT) setHasMoreFollowing(false);
          setFollowing((prev) => [...prev, ...res.data]);
        }
      } catch (error) {
        console.error("Error fetching followers/following:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnections();
  }, [info, profileData._id, followersSkip, followingSkip]);

  useEffect(() => {
    if (!userInfoUpdate) return;

    setFollowers((prevFollowers) =>
      prevFollowers.map((f) =>
        f._id === userInfoUpdate ? { ...f, isFollowing: false } : f
      )
    );
    setFollowing((prevFollowers) =>
      prevFollowers.map((f) =>
        f._id === userInfoUpdate ? { ...f, isFollowing: false } : f
      )
    );
  }, [userInfoUpdate]);

 
  const handleFollowAndStateUpdate = async (userId) => {
 
    await handleFollow(userId);

 
    setFollowers((prevFollowers) =>
      prevFollowers.map((f) =>
        f._id === userId ? { ...f, isFollowing: true } : f
      )
    );
    setFollowing((prevFollowers) =>
      prevFollowers.map((f) =>
        f._id === userId ? { ...f, isFollowing: true } : f
      )
    );
  };
 

  useEffect(() => {
    if (info === "followers") {
      setFollowers([]);
      setFollowersSkip(0);
      setHasMoreFollowers(true);
    } else if (info === "following") {
      setFollowing([]);
      setFollowingSkip(0);
      setHasMoreFollowing(true);
    }
  }, [info, profileData._id]);

  const handleUnfollowAndStateUpdate = async (userId) => {
    setWantsUnfollow(true);

    let user;
    if (info === "followers") {
      user = followers.find((f) => f._id === userId);
    } else if (info === "following") {
      user = following.find((f) => f._id === userId);
    }

    setUserToBeUnfollowed(user);
  };

 
  let connectionText = "";
  if (followStatus.mutual) {
    connectionText = "Mutuals";
  } else if (followStatus.following) {
    connectionText = "Following";
  } else if (followStatus.followedBy) {
    connectionText = "Follows you";
  } else {
    connectionText = "No direct connection";
  }

  const memberSince = profileData.createdAt
    ? format(new Date(profileData.createdAt), "MMMM d, yyyy")
    : "Unknown";

 
  const renderContent = () => {
    switch (info) {
      case "followers":
        return (
          <div
            className="followers-list"
            onScroll={(e) => {
              const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
              if (
                scrollTop + clientHeight >= scrollHeight - 10 &&
                !isLoading &&
                info === "followers" &&
                hasMoreFollowers
              ) {
                setFollowersSkip((prev) => prev + LIMIT);
              }
            }}
          >
            {followers.length > 0 ? (
              <>
                {followers.map((follower) => (
                  <div key={follower._id} className="follower-item">
                    <div>
                      <div
                        onClick={() => {
                          navigate(`/profile/${follower.userName}`);
                          setInfo("about");
                        }}
                      >
                        <img src={follower.avatar} />
                      </div>
                      <div>
                        <h4>{follower.displayName}</h4>
                        <div className="name-lastname">
                          <p> {follower.name}</p>
                          <p>{follower.lastName}</p>
                        </div>
                      </div>
                    </div>

                    {follower._id !== currentUserId &&
                      (follower.isFollowing ? (
                        <button
                          className="unfollow"
                          onClick={() =>
                            handleUnfollowAndStateUpdate(follower._id)
                          }
                        >
                          Following
                        </button>
                      ) : (
                        <button
                          className="follow"
                          onClick={() => {
                            handleFollowAndStateUpdate(follower._id);
                          }}
                        >
                          Follow
                        </button>
                      ))}
                  </div>
                ))}
                {hasMoreFollowers && (
                  <div className="loading">
                    <div className="spinner"></div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: "auto" }}> no followers yet.</p>
            )}
          </div>
        );
      case "following":
        return (
          <div
            className="followers-list"
            onScroll={(e) => {
              const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
              if (
                scrollTop + clientHeight >= scrollHeight - 10 &&
                !isLoading &&
                info === "following" &&
                hasMoreFollowing
              ) {
                setFollowingSkip((prev) => prev + LIMIT);
              }
            }}
          >
            {following.length > 0 ? (
              <>
                {following.map((user) => (
                  <div key={user._id} className="follower-item">
                    <div>
                      <div
                        onClick={() => {
                          navigate(`/profile/${user.userName}`);
                          setInfo("about");
                        }}
                      >
                        <img src={user.avatar} />
                      </div>

                      <div>
                        <h4>{user.displayName}</h4>
                        <div className="name-lastname">
                          <p>{user.name}</p>
                          <p>{user.lastName}</p>
                        </div>
                      </div>
                    </div>
                    {user._id !== currentUserId &&
                      (user.isFollowing ? (
                        <button
                          className="unfollow"
                          onClick={() => handleUnfollowAndStateUpdate(user._id)}
                        >
                          Following
                        </button>
                      ) : (
                        <button
                          className="follow"
                          onClick={() => handleFollowAndStateUpdate(user._id)}
                        >
                          Follow
                        </button>
                      ))}
                  </div>
                ))}
                {hasMoreFollowing && (
                  <div className="loading">
                    <div className="spinner"></div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: "auto" }}>not following anyone yet.</p>
            )}
          </div>
        );

      case "about":
      default:
        return (
          <>
            <div className="user-info">
              <div className="details">
                <div className="profile-info">
                  <div>
                    <h6>Connection Status</h6>
                    <p>
                      {!isCurrentUser ? connectionText : "This is your profile"}
                    </p>
                  </div>
                  <div>
                    <h6>Member since</h6>
                    <p>{memberSince}</p>
                  </div>
                </div>
                <div className="profile-info">
                  <div>
                    <h6>Username</h6>
                    <p>@{profileData.displayName}</p>
                  </div>
                  <div>
                    <h6>Status</h6>
                    <p>online</p>
                  </div>
                </div>
              </div>
              <div className="followers">
                <div>
                  <h6>People</h6>
                  <p>
                    <span>followers</span>
                    <span>{profileData.followersCount}</span>
                  </p>
                  <p>
                    <span>following</span>
                    <span>{profileData.followingCount}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return <div className="user-info-container">{renderContent()}</div>;
};

export default UserInfo;
