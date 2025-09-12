import { Navigate } from "react-router-dom";

export function PublicRoute({ children }) {
  const user = localStorage.getItem("currentUserId");
  if (user) return <Navigate to="/home" replace />;
  return children;
}
