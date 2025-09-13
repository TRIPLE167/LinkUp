import Sidebar from "../SideBar";
import "./Settings.scss";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AvatarCrop from "../AvatarCrop/AvatarCrop";
import { getCroppedImg } from "../AvatarCrop/getCroppedImg";
import { useChat } from "../../../context/ChatContext";
// Convert file to data URL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const Settings = () => {
  const navigate = useNavigate();
  const usernameInputRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);
  const { currentUser, setCurrentUser } = useChat();
  const [CROP_SIZE, setCROP_SIZE] = useState(250);
  const [userName, setUserName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState("");
  const [displaySize, setDisplaySize] = useState({ width: 200, height: 200 });
  const [imgSize, setImgSize] = useState({ width: 200, height: 200 });
  const [wantsEdit, setWantsEdit] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const fileInputRef = useRef(null);

  const handleLogOut = () => {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("email");
    navigate("/"), { replace: true };
  };

  useEffect(() => {
    const input = usernameInputRef.current;
    if (!input) return;

    const handleFocus = () => setInputFocused(true);
    const handleBlur = () => setInputFocused(false);

    input.addEventListener("focus", handleFocus);
    input.addEventListener("blur", handleBlur);

    return () => {
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("blur", handleBlur);
    };
  }, []);

  const validateUsername = () => {
    const trimmed = userName.trim();
    if (trimmed.length < 4 || trimmed.length > 20) {
      setErrorMessage("Username must be between 4 and 20 characters");
      return false;
    }
    const usernameRegex =
      /^(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._-]{2,18})[a-zA-Z0-9]$/;
    if (!usernameRegex.test(trimmed)) {
      setErrorMessage(
        "Username can only contain letters, numbers, underscores (_), dots (.), and hyphens (-). Cannot start/end with special characters or have consecutive special characters."
      );
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!validateUsername()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/username`, {
        username: userName.trim().toLowerCase(),
        displayName: userName,
        email: currentUser.email,
      });
      if (res.status === 200) {
        setErrorMessage("Username updated successfully");
        setCurrentUser((prev) => ({
          ...prev,
          displayName: userName,
        }));
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      }
    } catch (err) {
      if (err.response?.status === 409)
        setErrorMessage("Username already taken");
      else console.error(err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file); // <-- convert file to data URL
      setAvatarFile(file);
      setAvatarPreview(dataUrl); // <-- keep this for getCroppedImg
      setPosition({ x: 0, y: 0 });
      setErrorMessage("");
    } catch {
      setErrorMessage("Failed to read the selected file");
    }
  };
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setPosition({ x: 0, y: 0 });
    setCroppedAvatarPreview("");
    if (fileInputRef.current) fileInputRef.current.value = null;
    setErrorMessage("");
    setCroppedBlob(null);
  };

  const handleSetAvatar = async () => {
    try {
      if (!avatarPreview) return setErrorMessage("No image selected");

      const blob = await getCroppedImg(
        avatarPreview, // must be the original data URL
        position,
        CROP_SIZE,
        displaySize,
        imgSize
      );

      const url = URL.createObjectURL(blob);
      setCroppedAvatarPreview(url);
      setCroppedBlob(blob); // <-- Save the blob
      setAvatarPreview(""); // optional, hide original
    } catch (err) {
      console.error("Cropping failed:", err);
      setErrorMessage("Cropping failed");
    }
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!croppedBlob) return setErrorMessage("No cropped avatar"); // <-- Use the blob
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.png");
      formData.append("userId", currentUser._id);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/avatars/update`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.status === 200) {
        setCurrentUser((prev) => ({ ...prev, avatar: res.data.avatarUrl }));
        setEditingOption("options");
        clearAvatar();
      }
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      console.error(err);
      setErrorMessage("Error updating avatar");
    }
  };

  return (
    <div className="settings-container">
      <Sidebar />
      <div className="settings-page">
        <h5>Settings</h5>

        <div className="user-info">
          <img src={currentUser.avatar} alt="user_avatar" />
          <div>
            <h5>{currentUser.displayName}</h5>
            <p>
              {currentUser.name} {currentUser.lastName}
            </p>
          </div>
        </div>

        {!wantsEdit && (
          <div className="options">
            <h5>Account Settings</h5>
            <button
              onClick={() => {
                setWantsEdit(true);
                setEditingOption("options");
              }}
            >
              Edit Profile
            </button>
            <button onClick={handleLogOut}>Log Out</button>
          </div>
        )}

        {/* Edit options */}
        {wantsEdit && editingOption === "options" && (
          <div className="edit-section">
            <button
              className="option"
              onClick={() => setEditingOption("username")}
            >
              Change Username
            </button>
            <button
              className="option"
              onClick={() => setEditingOption("avatar")}
            >
              Change Avatar
            </button>
            <button
              type="button"
              className="arrow"
              onClick={() => {
                setWantsEdit(false);
                setEditingOption(null);
                setErrorMessage("");
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Username edit */}
        {editingOption === "username" && (
          <div className="edit-section">
            <h5>Change Username</h5>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Choose New UserName"
                onChange={(e) => setUserName(e.target.value.trimStart())}
                value={userName}
                ref={usernameInputRef}
              />
              <p
                className={
                  errorMessage === "Username updated successfully"
                    ? "correct"
                    : "error"
                }
              >
                {errorMessage}
              </p>
              <button type="submit" className="submit">
                Submit
              </button>
            </form>
            <button
              type="button"
              className="arrow"
              onClick={() => {
                setEditingOption("options");
                setUserName("");
                setErrorMessage("");
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Avatar edit */}
        {editingOption === "avatar" && (
          <div className="edit-section">
            {/* Form for uploading final avatar */}
            <form onSubmit={handleAvatarSubmit}>
              {/* If user hasn't chosen/cropped yet, show file input circle */}
              {!avatarPreview && !croppedAvatarPreview && (
                <label className="avatar-circle">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-4"
                    >
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                    </svg>
                    <p>Choose a photo from your device</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    ref={fileInputRef}
                    style={{ display: "none" }}
                  />
                </label>
              )}

              {avatarPreview && !croppedAvatarPreview && (
                <>
                  <AvatarCrop
                    image={avatarPreview}
                    position={position}
                    setPosition={setPosition}
                    displaySize={displaySize}
                    setDisplaySize={setDisplaySize}
                    setOriginalSize={setImgSize}
                    setCROP_SIZE={setCROP_SIZE}
                  />
                  <div
                    className="avatar-buttons"
                    style={{ width: `${displaySize?.width}px` }}
                  >
                    <button
                      className="cancel"
                      style={{ width: `${displaySize?.width / 3}px` }}
                      onClick={() => {
                        setAvatarPreview("");
                        setAvatarFile(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="set-avatar"
                      style={{ width: `${displaySize?.width / 3}px` }}
                      onClick={handleSetAvatar}
                    >
                      Set Avatar
                    </button>
                  </div>
                </>
              )}

              {/* Show the cropped avatar instead of circle/crop */}
              {croppedAvatarPreview && (
                <div className="photo">
                  <img src={croppedAvatarPreview} alt="Cropped Avatar" />
                  <button
                    className="trash"
                    onClick={() => {
                      setAvatarPreview("");
                      setAvatarFile(null);
                      setCroppedAvatarPreview("");
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                  <button type="submit" className="submit">
                    {isSubmitting ? "Uploading..." : "Upload"}
                  </button>
                </div>
              )}
            </form>

            <button
              type="button"
              className="arrow"
              onClick={() => {
                setEditingOption("options");
                clearAvatar();
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
