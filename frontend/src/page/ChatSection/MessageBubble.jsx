import React, { useState, useRef } from "react";
import { FaPlus, FaSmile} from "react-icons/fa";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hooks/useOutsideClick";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import { FaTrashAlt, FaRegCopy } from "react-icons/fa";


const MessageBubble = ({ message, theme, onReact, currentUser,deleteMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const messageRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
const optionsRef = useRef(null);


  const emojiPickerRef = useRef(null);
  const reactionsMenuRef = useRef(null);

  const isUserMessage = message.sender._id === currentUser._id;

  const bubbleClass = isUserMessage ? `chat-end` : `chat-start`;

  const bubbleContentClass = isUserMessage
    ? `chat-bubble  md:max-w-[50%] min-w-[130px]  ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
      }`
    : `chat-bubble  md:max-w-[50%] min-w-[130px]   ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-white text-black"
      }`;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });
  useOutsideClick(reactionsMenuRef, () => {
    if (showReactions) setShowReactions(false);
  });

  useOutsideClick(optionsRef, () => {
  if (showOptions) setShowOptions(false);
});

  if (message === 0) return;

  return (
    <div className={`chat ${bubbleClass}`}>
      <div
        className={`${bubbleContentClass} relative group `}
        ref={messageRef}
      >
        <div className="flex  justify-center gap-2">
          {message.contentType === "text" && <p className="mr-2">{message.content}</p>}
          {message.contentType === "image" && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                alt="Shared image"
                className="rounded-lg max-w-xs"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}

{message.contentType === "video" && (
           <div>
             <video
               controls
               className="rounded-lg max-w-xs"
               src={message.imageOrVideoUrl}
             />
             <p className="mt-1">{message.content}</p>
           </div>
         )}

        </div>
                  <div className="self-end flex items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2">
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
            {isUserMessage && (
              <>
                {message.messageStatus === "send" && <FaCheck size={12} />}
                {message.messageStatus === "delivered" && (
                  <FaCheckDouble size={12} />
                )}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={12} className="text-blue-900" />
                )}
              </>
            )}
          </div>

          {/* 3-dot options menu icon - shows on hover */}
<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 ">
  <button
    onClick={() => setShowOptions((prev) => !prev)}
    className={`p-1 rounded-full ${
      theme === "dark"
        ? " text-white"
        : " text-gray-800"
    }`}
  >
    <HiDotsVertical size={18} />
  </button>
</div>


        <div
          className={`absolute ${
            isUserMessage ? "-left-10" : "-right-10"
          } top-1/2 transform -translate-y-1/2 
                    opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}
        >
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`p-2 rounded-full ${
              theme === "dark"
                ? "bg-[#202c33] hover:bg-[#202c33]/80"
                : "bg-white hover:bg-gray-100"
            } shadow-lg`}
          >
            <FaSmile
              className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
            />
          </button>
        </div>

        {showReactions && (
          <div
            ref={reactionsMenuRef}
            className={`absolute -top-8 ${
              isUserMessage ? "left-0" : "left-36"
            } transform -translate-x-1/2 flex items-center bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg z-50`}
          >
            {quickReactions.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
            <div className="w-[1px] h-5 bg-gray-600 mx-1" />
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="hover:bg-[#ffffff1a] rounded-full p-1"
            >
              <FaPlus className="h-4 w-4 text-gray-300" />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute left-0 mb-6 z-50">
            <div className="relative">
              <EmojiPicker
                onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                theme={theme}
              />
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <RxCross2 />
              </button>
            </div>
          </div>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-5 ${
              isUserMessage ? "right-2" : "left-2"
            }
                        ${
                          theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                        } rounded-full px-2 py-1 shadow-md`}
          >
            {message.reactions.map((reaction, index) => (
              <span key={index} className="mr-1">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}


{showOptions && (
  <div
    ref={optionsRef}
    className={`absolute top-8 right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm 
      ${theme === "dark" ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"} 
      b`}
  >
    {/* Copy Button */}
    <button
      onClick={() => {
        if (message.contentType === "text") {
          navigator.clipboard.writeText(message.content);
        }
        setShowOptions(false);
      }}
      className="flex items-center w-full px-4 py-2 gap-3 rounded-lg 
        "
    >
      <FaRegCopy  size={14} />
      <span>Copy</span>
    </button>

    {/* Delete Button */}
    {isUserMessage && (
      <button
        onClick={() => {
          deleteMessage(message._id);
          setShowOptions(false);
        }}
        className="flex items-center w-full px-4 py-2 gap-3 rounded-lg 
          text-red-600"
      >
        <FaTrashAlt className="text-red-500" size={14} />
        <span>Delete</span>
      </button>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default MessageBubble;
