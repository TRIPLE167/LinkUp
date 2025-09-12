import React, { useRef, useState, useEffect } from "react";
import "../../styles/verification.scss";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import { useLocation } from "react-router-dom";

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const inputsRef = useRef([]);
  const [verificationResponse, setVerificationResponse] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const from = location.state?.from;

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    for (let i = 0; i < paste.length; i++) {
      inputsRef.current[i].value = paste[i];
    }
    const firstEmptyIndex = inputsRef.current.findIndex(
      (input) => !input.value
    );
    if (firstEmptyIndex !== -1) {
      inputsRef.current[firstEmptyIndex].focus();
    } else {
      inputsRef.current[5].focus();
    }
  };

  const handleChange = (e, i) => {
    const value = e.target.value.replace(/\D/g, "");
    e.target.value = value.slice(0, 1);
    if (value && i < inputsRef.current.length - 1) {
      inputsRef.current[i + 1].focus();
    }
  };

  const handleFocus = (i) => {
    if (inputsRef.current[i].value) return;
    const firstEmptyIndex = inputsRef.current.findIndex(
      (input) => !input.value
    );
    if (firstEmptyIndex !== -1) {
      inputsRef.current[firstEmptyIndex].focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !e.target.value && i > 0) {
      inputsRef.current[i - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const code = inputsRef.current.map((input) => input.value).join("");
    if (code.length < 6) {
      setVerificationResponse("Please enter the full 6-digit code.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/verify-reset-code`,
        {
          code,
          email,
        }
      );

      navigate("/reset-password", { replace: true });
    } catch (error) {
      if (
        error.response?.status === 400 &&
        (error.response.data.message === "Invalid verification code" ||
          error.response.data.message === "Verification code expired")
      ) {
        setVerificationResponse("Invalid or expired code.");
      } else {
        console.error("Error:", error);
        setVerificationResponse("Server error. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verification-container">
      <img src="/images/mail.png" alt="mail icon" />
      <form onSubmit={handleSubmit}>
        <h1>
          If this email exists, a reset code has been sent to:
          <br />
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {email || "your email"}
          </a>
        </h1>
        <div className="input-container">
          {[...Array(6)].map((_, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength="1"
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={handlePaste}
              ref={(el) => (inputsRef.current[i] = el)}
              onFocus={() => handleFocus(i)}
            />
          ))}
        </div>
        <p>{verificationResponse}</p>
        <div className="buttons">
          <h4
            onClick={() => {
              navigate("/forgot-password", { replace: true });
              localStorage.clear();
            }}
            style={{ cursor: "pointer" }}
          >
            &larr; Go back
          </h4>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm Code"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerifyResetCode;
