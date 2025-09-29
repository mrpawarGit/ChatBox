import React, { useState } from "react";
import {
  FaSearch,
  FaUser,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaComment,
} from "react-icons/fa";
import useThemeStore from "../../store/themeStore";
import Layout from "../../components/Layout";
import { Link } from "react-router-dom";
import userStore from "../../store/useUserStore";
import { logoutUser } from "../../services/user.service";
import { toast } from "react-toastify";

export default function Setting() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const { user, clearUser } = userStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("user logged out");
    } catch (error) {
      console.error(error, "failed to log out");
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-[400px] border-r ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>

            {/* Search Bar */}
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search settings"
                className={`w-full ${
                  theme === "dark"
                    ? "bg-[#202c33] text-white"
                    : "bg-gray-100 text-black"
                } border-none pl-10 placeholder-gray-400 rounded p-2`}
                
              />
            </div>

            {/* Profile Section */}
            <div
              className={`flex items-center gap-4 p-3 ${
                theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
              } rounded-lg cursor-pointer mb-4`}
            >
              <img
                src={user?.profilePicture}
                alt="Profile"
                className="w-14 h-14 rounded-full"
              />
              <div>
                <h2 className="font-semibold">{user?.username}</h2>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
              <div className="space-y-1">
                {[
                  { icon: FaUser, label: "Account", href: "/user-details" },
                  { icon: FaComment, label: "Chats", href: "/" },
                  { icon: FaQuestionCircle, label: "Help" },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.label}
                    className={`w-full flex items-center gap-3 p-2 rounded ${
                      theme === "dark"
                        ? "text-white hover:bg-[#202c33]"
                        : "text-black hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <div
                      className={`border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }  w-full p-4`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}

                {/* Theme Button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`w-full flex items-center  gap-3 p-2 rounded ${
                    theme === "dark"
                      ? "text-white hover:bg-[#202c33]"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  {theme === "dark" ? (
                    <FaMoon className="h-5 w-5" />
                  ) : (
                    <FaSun className="h-5 w-5" />
                  )}
                  <div
                    className={`flex flex-col text-start border-b ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }  w-full p-2`}
                  >
                    Theme
                    <span className="ml-auto text-sm text-gray-400">
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={` w-full flex items-center gap-3 p-2 rounded text-red-500 ${
                  theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
                } mt-10 md:mt-36`}
              >
                <FaSignOutAlt className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
