import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/UserName.scss";

const UserName = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const email = localStorage.getItem("email");

  function validateUsername() {
    const trimmed = username.trim();

    if (trimmed.length < 4) {
      setServerResponse("Username must be between 4 and 20 characters");
      return false;
    }
    if (trimmed.length > 20) {
      setServerResponse("Username must be between 4 and 20 characters");
      return false;
    }

    const usernameRegex =
      /^(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._-]{2,18})[a-zA-Z0-9]$/;

    if (!usernameRegex.test(trimmed)) {
      setServerResponse(
        <>
          Username can only contain letters, numbers, underscores (_), dots (.),
          and hyphens (-).
          <br />
          It cannot start or end with special characters, and cannot have
          consecutive special characters.
        </>
      );

      return false;
    }

    setServerResponse("");
    return true;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateUsername()) {
      return;
    }

    try {
      const normalizedUsername = username.trim().toLowerCase();

      const res = await axios.post("${import.meta.env.VITE_API_URL}/username", {
        username: normalizedUsername,
        displayName: username,
        email,
      });

      if (
        res.data.success &&
        res.data.message === "Username set successfully"
      ) {
        navigate("/setup-avatar", { replace: true });
      }
    } catch (err) {
      setServerResponse(
        err.response?.data?.message || "Username already taken"
      );
    }
  };

  return (
    <form className="username-container" onSubmit={handleSubmit}>
      <h2>Set Up Your Username</h2>
      <p>
        Please choose a unique username. This will be visible to other users.
      </p>
      <div>
        <input
          type="text"
          placeholder="Enter your username"
          onChange={(event) => setUsername(event.target.value.trimStart())}
          value={username}
        />
        <h3>{serverResponse}</h3>
      </div>
      <button type="submit">Continue</button>
    </form>
  );
};

export default UserName;
