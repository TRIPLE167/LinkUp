import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const email = localStorage.getItem("email");
  if (!email) return <Navigate to="/" replace />;
  return children;
}
