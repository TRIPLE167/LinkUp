import React, { useRef, useState, useEffect } from "react";
import "../../styles/Verification.scss";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";

 

const Verification = () => {
  const navigate = useNavigate();
  const inputsRef = useRef([]);
  const [time, setTime] = useState(null);
  const [verificationResponse, setVerificationResponse] = useState("");
  const [resendCode, setResendCode] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [email, setEmail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const from = location.state?.from;
  useEffect(() => {
    setExpirationDate(localStorage.getItem("expirationDate"));
    setEmail(localStorage.getItem("email"));

    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (!expirationDate) return;

    const expiration = new Date(expirationDate);
    const now = new Date();
    let secondsLeft = Math.floor((expiration - now) / 1000);

    if (secondsLeft <= 0) {
      setTime(0);
      setResendCode(true);
      return;
    }

    setTime(secondsLeft);

    const interval = setInterval(() => {
      secondsLeft -= 1;

      if (secondsLeft <= 0) {
        clearInterval(interval);
        setTime(0);
        setResendCode(true);
      } else {
        setTime(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationDate]);

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
    if (inputsRef.current[i].value) {
      return;
    }
    let firstEmptyIndex = inputsRef.current.findIndex((input) => !input.value);
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
      const response = await axios.post("http://localhost:3000/verify", {
        code,
        email,
      });
      localStorage.setItem("currentUserId", response.data.userId);
      localStorage.removeItem("expirationDate");
      navigate("/setup-username", { replace: true });
    } catch (error) {
      if (
        error.response?.status === 400 &&
        (error.response.data.message === "Invalid verification code" ||
          error.response.data.message === "Verification code expired")
      ) {
        setVerificationResponse("Invalid verification code");
      } else {
        console.error("Error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsResending(true);
    try {
      const response = await axios.post("http://localhost:3000/resend-code", {
        email,
      });

      if (response.data.expirationDate) {
        localStorage.setItem("expirationDate", response.data.expirationDate);
        setExpirationDate(response.data.expirationDate);
        setResendCode(false);
        setVerificationResponse("");
        setTime(
          Math.floor(
            (new Date(response.data.expirationDate) - new Date()) / 1000
          )
        );

        inputsRef.current.forEach((input) => (input.value = ""));
        inputsRef.current[0].focus();
      }
    } catch (error) {
      console.error("Failed to resend verification code:", error);
      if (
        error.response &&
        error.response.status === 429 &&
        error.response.data.message === "Resend limit reached. Try again later."
      ) {
        setVerificationResponse("Resend limit reached. Try again later.");
      } else {
        setVerificationResponse(
          "Failed to resend code. Please try again later."
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verification-container">
      <img src="/images/mail.png" alt="" />
      <form onSubmit={handleSubmit}>
        <h1>
          We've sent a verification code to your email:
          <br />
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {email}
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
              navigate(from === "login" ? "/" : "/register", { replace: true });
              localStorage.clear();
            }}
          >
            &larr; Go back
          </h4>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Confirm Code"}
          </button>
        </div>
        {resendCode ? (
          <h2>
            code expired, &nbsp;
            <button
              type="button"
              className="resend-code"
              onClick={resendVerificationCode}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "resend code"}
            </button>
          </h2>
        ) : (
          <h2>code will expire in {time} seconds...</h2>
        )}
      </form>
    </div>
  );
};

export default Verification;
