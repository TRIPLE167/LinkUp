import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/ResetPassword.scss";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const validate = () => {
    const errors = {};

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword && newPassword.length > 6) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerMessage("");
    if (!validate()) return;

    setLoading(true);

    try {
      const email = localStorage.getItem("email");
      if (!email) {
        setServerMessage(
          "No email found. Please restart the password reset process."
        );
        setLoading(false);
        return;
      }

      await axios.post("${import.meta.env.VITE_API_URL}/reset-password", {
        email,
        newPassword,
      });

      setNewPassword("");
      setConfirmPassword("");
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      setServerMessage(
        error.response?.data?.message || "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="Reset-password-container"
      onSubmit={handleSubmit}
      noValidate
    >
      <h2>Reset Your Password</h2>
      <p>Choose your new password.</p>
      <div>
        <input
          type={showNewPassword ? "text" : "password"}
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setFieldErrors((fe) => ({ ...fe, newPassword: "" }));
            setServerMessage("");
          }}
        />
        <button
          type="button"
          onClick={() => setShowNewPassword((prev) => !prev)}
          className="eye"
        >
          <img src="/images/eye.png" alt="Toggle Password Visibility" />
        </button>
      </div>
      {fieldErrors.newPassword && <h3>{fieldErrors.newPassword}</h3>}

      <div>
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setFieldErrors((fe) => ({ ...fe, confirmPassword: "" }));
            setServerMessage("");
          }}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="eye"
        >
          <img src="/images/eye.png" alt="Toggle Password Visibility" />
        </button>
      </div>
      {fieldErrors.confirmPassword && <h3>{fieldErrors.confirmPassword}</h3>}

      {serverMessage && <h3>{serverMessage}</h3>}

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Reset Password"}
      </button>
    </form>
  );
};

export default ResetPassword;
