import React, { useState, useEffect } from "react";
import "../../styles/Register.scss";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverResponse, setServerResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 750);
  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        setLoading(true);

        const response = await axios.post("http://localhost:3000/register", {
          name,
          lastName,
          email: normalizedEmail,
          password,
        });

        localStorage.setItem("email", email);
        localStorage.setItem("expirationDate", response.data.expirationDate);

        navigate("/verification", {
          state: { from: "register" },
          replace: true,
        });
      } catch (error) {
        if (
          error.response?.status === 400 &&
          error.response.data.message === "User already exists"
        ) {
          setServerResponse(
            "Email is already used. Please use a different email."
          );
        } else if (
          error.response?.status === 429 &&
          error.response.data.message ===
            "Resend limit reached. Try again later."
        ) {
          setServerResponse(
            "Maximum verification attempts reached. \nPlease try again later."
          );
        } else {
          console.error("Error:", error);
          setServerResponse("Server error. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
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
    <div className="register-container">
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

      <div className="register-form">
        {isSmallScreen && (
          <div className="logo">
            <img src="/images/LinkUp.png" />
            <h3>LinkUp</h3>
          </div>
        )}
        <div>
          <h1>Hello!</h1>
          <p>Sign Up to Get Started</p>
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
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={handleInputChange("name", setName)}
                />
              </div>
              {errors.name && <p className="error">{errors.name}</p>}
            </div>

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
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={handleInputChange("lastName", setLastName)}
                />
              </div>
              {errors.lastName && <p className="error">{errors.lastName}</p>}
            </div>

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
                />
              </div>
              {errors.email ? (
                <p className="error">{errors.email}</p>
              ) : (
                serverResponse && (
                  <p className="error" style={{ whiteSpace: "pre-line" }}>
                    {serverResponse}
                  </p>
                )
              )}
            </div>
            <div>
              <div>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <img src="/images/eye.png" alt="Toggle Password Visibility" />
                </button>
              </div>
              {errors.password && <p className="error">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Registering your account..." : "Sign Up"}
            </button>
            <p className="login-link">
              Already have an account?{" "}
              <span onClick={() => navigate("/")}>Sign In</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
