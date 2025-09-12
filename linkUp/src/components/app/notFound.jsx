import React from "react";
import "../../styles/NotFound.scss";
const NotFound = () => (
  <div className="not-found">
    <h1>Sorry, this page isn't available.</h1>
    <p>
      The link you followed may be broken, or the page may have been removed.{" "}
      <a style={{ color: "#4150F7", cursor: "pointer" }} href="/home">
        Go back to LinkUp.
      </a>
    </p>
  </div>
);

export default NotFound;
