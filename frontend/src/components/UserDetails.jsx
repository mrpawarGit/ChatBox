import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCamera, FaPencilAlt, FaCheck, FaSmile } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import Layout from "./Layout";
import EmojiPicker from "emoji-picker-react";
import useThemeStore from "../store/themeStore";
import userStore from "../store/useUserStore";
import { updateUserProfile } from "../services/user.service";
import { toast } from "react-toastify";

export default function UserDetails() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("Hey there! I am using WhatsApp.");
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const { user, setUser } = userStore();
  const { theme } = useThemeStore();
  console.log(user);

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setAbout(user.about || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleAvatarSelect = (url) => {
    setProfileImage(null); // remove file if avatar selected
    setPreview(url);
    setShowAvatarModal(false);
  };

  const handleSave = async (field) => {
    try {
      const formData = new FormData();
      if (field === "name") {
        formData.append("username", name);
        setIsEditingName(false);
        setShowNameEmoji(false);
      } else if (field === "about") {
        formData.append("about", about);
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }
      if (profileImage && field === "profile") {
        formData.append("media", profileImage);
      }

      const updated = await updateUserProfile(formData);
      setUser(updated.data);
      setProfileImage(null);
      setPreview(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleEmojiSelect = (emoji, field) => {
    if (field === "name") {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false); // ✅ Auto close after select
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setShowAboutEmoji(false); // ✅ Auto close after select
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full min-h-screen flex border-r ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)]  border-gray-600 text-white"
            : "bg-gray-100  border-gray-200 text-black"
        }`}
      >
        <div className="w-full rounded-lg p-6">
          <div className="flex items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <img
                  src={preview || user?.profilePicture}
                  alt="Profile Picture"
                  className="w-52 h-52 rounded-full mb-2 object-cover"
                />
                <label
                  htmlFor="profileUpload"
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-white text-center">
                    <FaCamera className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm">Change</span>
                  </div>
                  <input
                    type="file"
                    id="profileUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {preview && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    handleSave("profile"); // 🔁 Reuse handleSave
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Change
                </button>
                <button
                  onClick={() => {
                    setProfileImage(null);
                    setPreview(null);
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Discard
                </button>
              </div>
            )}

            <div
              className={`relative p-4 ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              } shadow-sm rounded-lg`}
            >
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1 text-gray-500 text-start"
              >
                Your Name
              </label>
              <div className="flex items-center">
                {isEditingName ? (
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      theme === "dark"
                        ? "bg-gray-700 text-white"
                        : "bg-white text-black"
                    }`}
                  />
                ) : (
                  <span className="w-full px-3 py-2">
                    {user?.username || name}
                  </span>
                )}
                {isEditingName ? (
                  <>
                    <button
                      onClick={() => handleSave("name")}
                      className="ml-2 focus:outline-none"
                    >
                      <FaCheck className="h-5 w-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => setShowNameEmoji(!showNameEmoji)}
                      className="ml-2 focus:outline-none"
                    >
                      <FaSmile className="h-5 w-5 text-yellow-500" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setShowNameEmoji(false); // ✅ Auto close emoji picker
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <MdCancel className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 focus:outline-none"
                  >
                    <FaPencilAlt className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
              {showNameEmoji && (
                <div className="absolute z-10 -top-80">
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "name")}
                  />
                </div>
              )}
            </div>
            <div
              className={`relative p-4 ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              } shadow-sm rounded-lg`}
            >
              <label
                htmlFor="about"
                className="block text-sm font-medium mb-1 text-gray-500"
              >
                About
              </label>
              <div className="flex items-center">
                {isEditingAbout ? (
                  <input
                    id="about"
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      theme === "dark"
                        ? "bg-gray-700 text-white"
                        : "bg-white text-black"
                    }`}
                  />
                ) : (
                  <span className="w-full px-3 py-2">{about}</span>
                )}
                {isEditingAbout ? (
                  <>
                    <button
                      onClick={() => handleSave("about")}
                      className="ml-2 focus:outline-none"
                    >
                      <FaCheck className="h-5 w-5 text-green-500" />
                    </button>
                    <button
                      onClick={() => setShowAboutEmoji(!showAboutEmoji)}
                      className="ml-2 focus:outline-none"
                    >
                      <FaSmile className="h-5 w-5 text-yellow-500" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAbout(false);
                        setShowAboutEmoji(false); // ✅ Auto close emoji picker
                      }}
                      className="ml-2 focus:outline-none"
                    >
                      <MdCancel className="h-5 w-5 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    className="ml-2 focus:outline-none"
                  >
                    <FaPencilAlt className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
              {showAboutEmoji && (
                <div className="absolute z-10 mt-2 -top-96">
                  <EmojiPicker
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji, "about")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
