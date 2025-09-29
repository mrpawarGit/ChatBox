import { create } from "zustand";
import axiosInstance from "../services/url.service";
import { getSocket } from "../services/chat.service";

// Zustand store for managing chat-related state and actions
export const useChatStore = create((set, get) => ({
  // ======== State Variables ========
  conversations: [], // List of all conversations
  currentConversation: null, // Currently selected conversation ID
  messages: [], // Messages of the current conversation
  loading: false, // Loader for API calls
  error: null, // Error holder
  onlineUsers: new Map(), // userId -> { isOnline, lastSeen }
  typingUsers: new Map(), // conversationId -> Set of userIds who are typing

  // ======== Socket Event Listeners Setup ========
  initSocketListeners: () => { 
    const socket = getSocket();
    if (!socket) return;

    // Remove existing listeners to prevent duplicate handlers
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    // Confirm message delivery
    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg
        ),
      }));
    });

    // Update message read/delivered status
    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg
        ),
      }));
    });

    // Handle reactions on messages
    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
    });
  
    // Remove a message from local state when deleted by sender (real-time sync)
    socket.on("message_deleted", (deletedMessageId) => {
  console.log("Message deleted:", deletedMessageId);
  set((state) => ({
    messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
  }));
});

    // Handle any message sending error
    socket.on("message_error", (error) => {
      console.error("Message error:", error);
    });

    // Listen for typing indicators
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }

        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }

        return { typingUsers: newTypingUsers };
      });
    });

    // Track user's online/offline status
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    // Emit status check for all users in the conversation list
    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== get().currentUser?._id
        );
        if (otherUser?._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  // ======== Set Current User ========
  setCurrentUser: (user) => set({ currentUser: user }),

  // ======== Fetch Conversations from API ========
  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chats/conversations");
      set({ conversations: data, loading: false });

      // Initialize socket after fetching conversations
      get().initSocketListeners();
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      return null;
    }
  },

  // ======== Fetch Messages for a Conversation ========
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;

    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`
      );

      const messageArray = data.data || data || [];

      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      // Mark unread messages as read
      const { markMessagesAsRead } = get();
      markMessagesAsRead();

      return messageArray;
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      return [];
    }
  },

  // ======== Send a Message with Optimistic Update ========
  sendMessage: async (formData) => {
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");

    const socket = getSocket();

    // Find existing conversation between sender & receiver
    const { conversations } = get();
    let conversationId = null;

    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId)
      );

      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    // Temporary message before actual response
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== "string" ? URL.createObjectURL(media) : null,
      content: content,
      contentType: media
        ? media.type.startsWith("image")
          ? "image"
          : "video"
        : "text",
      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      // Send to backend API
      const { data } = await axiosInstance.post(
        "/chats/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(data)
      const messageData = data.data || data;

      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg
        ),
      }));

      // Notify other user via socket
      if (socket) {
        socket.emit("send_message", messageData);
      }

      return messageData;
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark message as failed if API fails
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg
        ),
        error: error.response?.data?.message || error.message,
      }));
      throw error;
    }
  },

  // ======== Add Message from Socket into Store ========
  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const messageExists = messages.some((msg) => msg._id === message._id);
    if (messageExists) return;

    if (message.conversation === currentConversation) {
      set((state) => ({
        messages: [...state.messages, message],
      }));

      // Automatically mark as read if viewing the conversation
      if (message.receiver?._id === currentUser?._id) {
        get().markMessagesAsRead();
      }
    }

    // Update conversation preview and unread count
    set((state) => {
      const updatedConversations = state.conversations?.data?.map((conv) => {
        if (conv._id === message.conversation) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              message.receiver?._id === currentUser?._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });

      return {
        conversations: {
          ...state.conversations,
          data: updatedConversations,
        },
      };
    });
  },

  // ======== Mark Unread Messages as Read ========
  markMessagesAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages?.length || !currentUser) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" && msg.receiver?._id === currentUser?._id
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    try {
      const { data } = await axiosInstance.put("/chats/messages/read", {
        messageIds: unreadIds,
      });
      console.log("Marked as read", data);

      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg
        ),
      }));

      // Emit update to sender
      const socket = getSocket();
      if (socket) {
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: messages[0]?.sender?._id,
        });
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  // Delete a message by ID
deleteMessage: async (messageId) => {
  try {
    // Make API call to delete the message
    await axiosInstance.delete(`/chats/messages/${messageId}`);

    // Optimistically remove from local state
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    }));

    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    set({ error: error.response?.data?.message || error.message });
    return false;
  }
},


  // ======== Add/Change/Delete Reaction ========
  addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();

    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        userId: currentUser._id,
      });
    }
  },

  // ======== Typing Events (start/stop) ========
  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();

    if (socket && currentConversation && receiverId) {
      console.log("Emitting typing start:", currentConversation, receiverId);
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();

    if (socket && currentConversation && receiverId) {
      console.log("Emitting typing stop:", currentConversation, receiverId);
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  // ======== Utility Getters ========
  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

  // ======== Cleanup Store ========
  cleanup: () => {
    // Clear all chat data from the store
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
