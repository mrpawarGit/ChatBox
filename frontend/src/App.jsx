import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomeScreen from "./components/HomePage";
import UserDetails from "./components/UserDetails";
import StatusPage from "./page/StatusSection/StatusPage";
import Login from "./page/user-login/Login";
import { ProtectedRoute, PublicRoute } from "./Protected";
import Setting from "./page/SettingSection/Seetings";
import { useChatStore } from "./store/chatStore";
import userStore from "./store/useUserStore";
import { disconnectSocket, initializeSocket } from "./services/chat.service";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { setCurrentUser, initSocketListeners, cleanup } = useChatStore();
  const { user } = userStore();

  useEffect(() => {
    // Initialize socket when user is logged in
    if (user?._id) {
      const socket = initializeSocket();

      if (socket) {
        // Set current user in chat store
        setCurrentUser(user);

        // Initialize socket listeners
        initSocketListeners();
      }
    }

    // Cleanup on unmount
    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [user, setCurrentUser, initSocketListeners, cleanup]);
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/user-details" element={<UserDetails />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
