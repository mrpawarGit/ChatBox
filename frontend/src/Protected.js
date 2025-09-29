import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import userStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader";

export const ProtectedRoute = () => {
  const location = useLocation(); // Get current location to redirect back after login
  const [isChecking, setIsChecking] = useState(true); // State to show loader while verifying auth

  const { isAuthenticated, setUser, clearUser } = userStore(); // Access user auth state and actions from your store

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // API call to check if the user is authenticated (e.g., via cookie or token)
        const result = await checkUserAuth();

        if (result?.isAuthenticated) {
          setUser(result?.user); // User is authenticated → update store with user info
        } else {
          clearUser(); //  Not authenticated → clear user state
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        clearUser(); // On error, assume unauthenticated
      } finally {
        setIsChecking(false); //  Done checking → hide loader
      }
    };

    verifyAuth();
  }, [setUser, clearUser]);

  if (isChecking) {
    return <Loader />; // Show loader while checking auth status
  }

  if (!isAuthenticated) {
    // User not authenticated → redirect to login page
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  // User is authenticated → render protected route's children
  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = userStore((state) => state.isAuthenticated); // Get auth state from store

  if (isAuthenticated) {
    // If user is already logged in → redirect away from public page (e.g., login or register)
    return <Navigate to="/" replace />;
  }

  // User not logged in → allow access to public routes
  return <Outlet />;
};
