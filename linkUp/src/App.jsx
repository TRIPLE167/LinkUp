import { Routes, Route } from "react-router-dom";
import Register from "./components/auth/Register";
import Verification from "./components/auth/Verification"; 
import Home from "./components/app/Home";
import UserName from "./components/auth/UserName";
import LogIn from "./components/auth/LogIn";
import VerifyResetCode from "./components/auth/VerifyResetCode";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import SetAvatar from "./components/auth/SetAvatar";
import Profile from "./components/app/profile/Profile";
import { ProtectedRoute } from "./components/app/privateAndPublicRoutes/ProtectedRoute.jsx";
import { PublicRoute } from "./components/app/privateAndPublicRoutes/PublicRoute.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import NotFound from "./components/app/notFound.jsx";
import Settings from "./components/app/Settings/Settings.jsx";
function App() {
  const publicRoutes = [
    { path: "/", element: <LogIn /> },
    { path: "/register", element: <Register /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
  ];

 
  const protectedRoutesWithChat = [
    { path: "/home", element: <Home /> },
    { path: "/home/:chatId", element: <Home /> },
    { path: "/profile/:userName", element: <Profile /> },
    { path: "/settings/", element: <Settings /> },
  ];

  const protectedRoutesWithoutChat = [
    { path: "/verification", element: <Verification /> },
    { path: "/setup-username", element: <UserName /> },
    { path: "/setup-avatar", element: <SetAvatar /> },
    { path: "/reset-code", element: <VerifyResetCode /> },
    { path: "/reset-password", element: <ResetPassword /> },
  ];

  return (
    <Routes>
      {publicRoutes.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={<PublicRoute>{r.element}</PublicRoute>}
        />
      ))}

      {protectedRoutesWithoutChat.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={<ProtectedRoute>{r.element}</ProtectedRoute>}
        />
      ))}

      {protectedRoutesWithChat.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={
            <ProtectedRoute>
              <ChatProvider>{r.element}</ChatProvider>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
