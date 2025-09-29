import { create } from "zustand"
import { persist } from "zustand/middleware"

const useStore = create(
    persist(
      (set) => ({
        activeTab: 'chats',
        selectedContact: null,
        setSelectedContact: (contact) => set({ selectedContact: contact }),
        setActiveTab: (tab) => {set({ activeTab: tab })},
        }),
      {
        name: "whatsapp-storage",
        getStorage: () => localStorage,
      }
    )
  );
export default useStore