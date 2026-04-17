import { createContext, useContext, useState } from "react";
import { Conversation } from "@/types/chat";

interface AppContextType {
  conversations: Conversation[];
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updater: (c: Conversation) => Conversation) => void;
  setActiveConvId: (id: string | null) => void;
  activeConvId: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const addConversation = (conv: Conversation) =>
    setConversations((prev) => [conv, ...prev]);

  const updateConversation = (id: string, updater: (c: Conversation) => Conversation) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));

  return (
    <AppContext.Provider value={{ conversations, addConversation, updateConversation, activeConvId, setActiveConvId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
