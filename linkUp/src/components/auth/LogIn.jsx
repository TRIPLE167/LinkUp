import React, { useState, useEffect } from "react";
import "../../styles/Login.scss";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LogIn = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverResponse, setServerResponse] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [verifyTargetEmail, setVerifyTargetEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 750);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      errors.email = "Email is invalid";
    }

    if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      serverResponse === "Please verify your email before logging in." &&
      email.trim().toLowerCase() !== verifyTargetEmail
    ) {
      setServerResponse("");
    }
  }, [serverResponse, email, verifyTargetEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerResponse("");
    setShowVerifyButton(false);

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3000/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        localStorage.setItem("email", email.trim().toLocaleLowerCase());
        localStorage.setItem("currentUserId", response.data.userId);

        navigate("/home", { replace: true });
      } else {
        setServerResponse("Unexpected server response.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setServerResponse("Invalid email or password.");
      } else if (error.response?.status === 403) {
        setServerResponse("Please verify your email before logging in.");
        setShowVerifyButton(true);
        setVerifyTargetEmail(email.trim().toLowerCase());
      } else {
        setServerResponse("An error occurred. Please try again later.");
        console.error("Login error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRedirect = async () => {
    setVerifying(true);
    try {
      const response = await axios.post("http://localhost:3000/login-verify", {
        email: email.trim().toLowerCase(),
      });

      if (response.status === 200) {
        localStorage.setItem("email", email.trim().toLowerCase());
        localStorage.setItem("expirationDate", response.data.expirationDate);
        navigate("/verification", { state: { from: "login" }, replace: true });
      }
    } catch (error) {
      if (
        error.response?.status === 404 &&
        error.response.data.message === "User not found."
      ) {
        setServerResponse(
          "We couldn’t find a user with that email. \nPlease check your email address and try again."
        );
      } else if (
        error.response?.status === 429 &&
        error.response.data.message === "Resend limit reached. Try again later."
      ) {
        setServerResponse(
          "Maximum verification attempts reached. \nplease try again later."
        );
      }
      console.error("Re-verification failed:", error);
    } finally {
      setVerifying(false);
    }
  };

 
  const handleInputChange = (field, setter) => (e) => {
    setter(e.target.value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    if (serverResponse) setServerResponse("");
  };

  return (
    <div className="login-container">
      {!isSmallScreen && (
        <div className="bg-image">
          <div>
            <h1>LinkUp</h1>
            <p>
              LinkUp lets you easily connect and chat with friends. Create an
              account, pick a username, and start talking instantly!
            </p>
          </div>
          <img src="/images/circles.png" alt="" />
        </div>
      )}

      <div className="login-form">
        {isSmallScreen && (
          <div className="logo">
            <img src="/images/LinkUp.png" />
            <h3>LinkUp</h3>
          </div>
        )}
        <div>
          <h1>Hello Again!</h1>
          <p>Welcome Back</p>

          <form onSubmit={handleSubmit}>
            <div>
              <div>
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={handleInputChange("email", setEmail)}
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="error">{errors.email}</p>}
            </div>

            <div>
              <div className="password-input">
                {showPassword ? (
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
                      d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                ) : (
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                )}
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={handleInputChange("password", setPassword)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="show-password-btn"
                >
                  <img src="/images/eye.png" alt="Toggle visibility" />
                </button>
              </div>
              {errors.password && <p className="error">{errors.password}</p>}

              {serverResponse && (
                <>
                  {serverResponse ===
                  "Maximum verification attempts reached. \nplease try again later." ? (
                    <p className="error" style={{ whiteSpace: "pre-line" }}>
                      {serverResponse}
                    </p>
                  ) : (
                    <>
                      {showVerifyButton &&
                      email.trim().toLowerCase() === verifyTargetEmail ? (
                        <h6 className="verify-button">
                          {verifying ? (
                            "Sending..."
                          ) : (
                            <>
                              Please{" "}
                              <span onClick={handleVerifyRedirect}>verify</span>{" "}
                              your email before logging in.
                            </>
                          )}
                        </h6>
                      ) : (
                        <p className="error" style={{ whiteSpace: "pre-line" }}>
                          {serverResponse}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <h5
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </h5>
            <p className="register-link">
              Don't have an account?{" "}
              <span onClick={() => navigate("/register")}>Sign Up</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
