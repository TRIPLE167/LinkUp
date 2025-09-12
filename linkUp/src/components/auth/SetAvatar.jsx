import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/SetAvatar.scss";
import AvatarCrop from "../app/AvatarCrop/AvatarCrop";
import { getCroppedImg } from "../app/AvatarCrop/getCroppedImg";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SetAvatar = () => {
  const navigate = useNavigate();

  const [avatarPreview, setAvatarPreview] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 200, height: 200 });
  const [imgSize, setImgSize] = useState({ width: 200, height: 200 });
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState("");
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [CROP_SIZE, setCROP_SIZE] = useState(250);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarPreview(dataUrl);
      setPosition({ x: 0, y: 0 });
      setCroppedAvatarPreview("");
      setCroppedBlob(null);
      setErrorMessage("");
    } catch {
      setErrorMessage("Failed to read the selected file");
    }
  };

  const clearSelectedAvatar = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setAvatarPreview("");
    setPosition({ x: 0, y: 0 });
    setCroppedAvatarPreview("");
    setCroppedBlob(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleCropConfirm = async () => {
    try {
      if (!avatarPreview) return setErrorMessage("No image selected");

      const blob = await getCroppedImg(
        avatarPreview,
        position,
        CROP_SIZE,
        displaySize,
        imgSize
      );

      const url = URL.createObjectURL(blob);
      setCroppedAvatarPreview(url);
      setCroppedBlob(blob);
    } catch (err) {
      console.error("Cropping failed:", err);
      setErrorMessage("Cropping failed");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!croppedBlob) {
      setErrorMessage("Please crop and confirm an image, or skip for now");
      return;
    }
    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem("currentUserId");
      if (!userId) {
        setErrorMessage("User not found. Please log in again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.png");
      formData.append("userId", userId);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/avatars/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) navigate("/home", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="set-avatar-container">
      <img className="banner" src="/images/LinkUp.png" alt="LinkUp" />

      <form onSubmit={handleSubmit}>
        <h1>Set Up Your Avatar</h1>

        {/* Step 1: choose file */}
        {!avatarPreview && !croppedAvatarPreview && (
          <div className="avatar-picker">
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              ref={fileInputRef}
            />
            <label htmlFor="avatar-upload" className="avatar-circle">
              <span className="icon" aria-hidden>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="#84848d"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text">Choose a photo from your device</span>
            </label>
          </div>
        )}

        {/* Step 2: crop */}
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
                type="button"
                className="cancel"
                onClick={clearSelectedAvatar}
                style={{ width: `${displaySize?.width / 3}px` }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="set-avatar"
                onClick={handleCropConfirm}
                style={{ width: `${displaySize?.width / 3}px` }}
              >
                Set Avatar
              </button>
            </div>
          </>
        )}

        {/* Step 3: preview + upload */}
        {croppedAvatarPreview && (
          <div className="photo">
            <img src={croppedAvatarPreview} alt="Cropped Avatar" />
            <button
              type="button"
              className="trash"
              onClick={clearSelectedAvatar}
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21
                     c.342.052.682.107 1.022.166m-1.022-.165L18.16
                     19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25
                     2.25 0 0 1-2.244-2.077L4.772
                     5.79m14.456 0a48.108 48.108 0 0
                     0-3.478-.397m-12 .562c.34-.059.68-.114
                     1.022-.165m0 0a48.11 48.11 0 0 1
                     3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964
                     51.964 0 0 0-3.32 0c-1.18.037-2.09
                     1.022-2.09 2.201v.916m7.5 0a48.667
                     48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        )}

        {errorMessage && <p className="error">{errorMessage}</p>}

        <div className="buttons">
          <div className="cta">
            <button
              type="button"
              className="skip"
              onClick={() => navigate("/home", { replace: true })}
            >
              Skip
            </button>
            <button type="submit" disabled={isSubmitting || !croppedBlob}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SetAvatar;
