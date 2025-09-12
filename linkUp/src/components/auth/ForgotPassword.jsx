import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailLower) {
      setServerMessage("Email is required.");

      return;
    }

    if (!emailRegex.test(emailLower)) {
      setServerMessage("Please enter a valid email address.");

      return;
    }

    setServerMessage("");

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/forgot-password`,
        {
          email: emailLower,
        }
      );

      localStorage.setItem("email", emailLower);

      navigate("/reset-code");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;

        setServerMessage(error.response.data.message || "Server error.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="username-container" onSubmit={handleSubmit}>
      <h2>Forgot Your Password?</h2>
      <p>Enter your email address and we’ll send you a reset code.</p>

      <div>
        <input
          type="email"
          placeholder="Email Address"
          onChange={(e) => {
            setEmail(e.target.value);
            setServerMessage("");
          }}
          value={email}
          disabled={loading}
        />
      </div>
      {serverMessage && <h3>{serverMessage}</h3>}

      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
};

export default ForgotPassword;
