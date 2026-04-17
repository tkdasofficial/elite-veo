import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Conversation, ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AppContextType {
  conversations: Conversation[];
  loading: boolean;
  activeConvId: string | null;
  setActiveConvId: (id: string | null) => void;

  createConversation: (title: string) => Promise<Conversation | null>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  loadMessages: (conversationId: string) => Promise<ChatMessage[]>;
  addMessage: (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => Promise<ChatMessage | null>;
  updateMessage: (messageId: string, content: string) => Promise<void>;

  // local in-memory copy of messages per conversation (for current view)
  messagesByConv: Record<string, ChatMessage[]>;
  setMessagesForConv: (conversationId: string, messages: ChatMessage[]) => void;
  appendLocalMessage: (conversationId: string, msg: ChatMessage) => void;
  patchLocalMessage: (conversationId: string, messageId: string, content: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const rowToConversation = (r: any): Conversation => ({
  id: r.id,
  title: r.title,
  messages: [],
  createdAt: new Date(r.created_at),
  videoType: "short",
});

const rowToMessage = (r: any): ChatMessage => ({
  id: r.id,
  role: r.role as "user" | "assistant",
  content: r.content,
  timestamp: new Date(r.created_at),
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({});

  // Load conversations whenever user changes
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessagesByConv({});
      setActiveConvId(null);
      return;
    }
    setLoading(true);
    supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setConversations(data.map(rowToConversation));
        setLoading(false);
      });
  }, [user]);

  const createConversation = useCallback(
    async (title: string): Promise<Conversation | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: title.slice(0, 80) })
        .select()
        .single();
      if (error || !data) return null;
      const conv = rowToConversation(data);
      setConversations((prev) => [conv, ...prev]);
      setMessagesByConv((prev) => ({ ...prev, [conv.id]: [] }));
      return conv;
    },
    [user]
  );

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    await supabase.from("conversations").update({ title: title.slice(0, 80) }).eq("id", id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessagesByConv((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setActiveConvId((curr) => (curr === id ? null : curr));
  }, []);

  const loadMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    const msgs = data.map(rowToMessage);
    setMessagesByConv((prev) => ({ ...prev, [conversationId]: msgs }));
    return msgs;
  }, []);

  const addMessage = useCallback<AppContextType["addMessage"]>(
    async (conversationId, role, content) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, user_id: user.id, role, content })
        .select()
        .single();
      if (error || !data) return null;
      const msg = rowToMessage(data);
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), msg],
      }));
      // touch conversation updated_at by updating it
      supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .then(() => {});
      return msg;
    },
    [user]
  );

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    await supabase.from("messages").update({ content }).eq("id", messageId);
  }, []);

  const setMessagesForConv = useCallback(
    (conversationId: string, messages: ChatMessage[]) => {
      setMessagesByConv((prev) => ({ ...prev, [conversationId]: messages }));
    },
    []
  );

  const appendLocalMessage = useCallback((conversationId: string, msg: ChatMessage) => {
    setMessagesByConv((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), msg],
    }));
  }, []);

  const patchLocalMessage = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, content } : m
        ),
      }));
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        conversations,
        loading,
        activeConvId,
        setActiveConvId,
        createConversation,
        updateConversationTitle,
        deleteConversation,
        loadMessages,
        addMessage,
        updateMessage,
        messagesByConv,
        setMessagesForConv,
        appendLocalMessage,
        patchLocalMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
