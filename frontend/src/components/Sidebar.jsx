import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { FaWhatsapp, FaUser, FaCog, FaUserCircle } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md"; // New icon for status
import useStore from "../store/layoutStore";
import userStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";

const Sidebar = () => {
  const location = useLocation();
  const { user } = userStore();
  const { activeTab, setActiveTab, selectedContact } = useStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats");
    } else if (location.pathname === "/status") {
      setActiveTab("status");
    } else if (location.pathname === "/user-details") {
      setActiveTab("user");
    } else if (location.pathname === "/setting") {
      setActiveTab("setting");
    }
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) {
    return null; // Don't render sidebar when a chat is selected on mobile
  }

  const sidebarContent = (
    <>
      <Link
        to="/"
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "chats" && "bg-gray-300 shadow-sm p-2 rounded-full"
        } focus:outline-none`}
      >
        <FaWhatsapp
          className={`h-6 w-6 ${
            activeTab === "chats"
              ? theme === "dark"
                ? "text-gray-800 "
                : ""
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>
      <Link
        to="/status"
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "status" && "bg-gray-300 shadow-sm p-2 rounded-full"
        }  focus:outline-none`}
      >
        <MdRadioButtonChecked
          className={`h-6 w-6 ${
            activeTab === "status"
              ? theme === "dark"
                ? "text-gray-800 "
                : ""
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>
      {!isMobile && <div className="flex-grow" />}
      <Link
        to="/user-details"
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "user" && "bg-gray-300 shadow-sm p-2 rounded-full"
        }  focus:outline-none`}
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="User"
            className="h-6 w-6 rounded-full "
          />
        ) : (
          <FaUserCircle
            className={`h-6 w-6 ${
              activeTab === "status"
                ? theme === "dark"
                  ? "text-gray-800 "
                  : ""
                : theme === "dark"
                ? "text-gray-300"
                : "text-gray-800"
            }`}
          />
        )}
      </Link>
      <Link
        to="/setting"
        className={`${isMobile ? "" : "mb-8"} ${
          activeTab === "setting" && "bg-gray-300 shadow-sm p-2 rounded-full"
        }  focus:outline-none`}
      >
        <FaCog
          className={`h-6 w-6 ${
            activeTab === "setting"
              ? theme === "dark"
                ? "text-gray-800 "
                : ""
              : theme === "dark"
              ? "text-gray-300"
              : "text-gray-800"
          }`}
        />
      </Link>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
                ${
                  isMobile
                    ? "fixed bottom-0 left-0 right-0 h-16"
                    : "w-16 h-screen border-r-2"
                }
                ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-[rgb(239,242,245)] border-gray-300"
                } 
                bg-opacity-90 flex items-center py-4 shadow-lg
                ${
                  isMobile
                    ? "flex-row justify-around"
                    : "flex-col justify-between"
                }
            `}
    >
      {sidebarContent}
    </motion.div>
  );
};

export default Sidebar;
