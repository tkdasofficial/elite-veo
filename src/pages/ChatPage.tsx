import { useState, useRef, useCallback, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageComponent from "@/components/chat/ChatMessage";
import ChatInput, { ModelTier, SendPayload } from "@/components/chat/ChatInput";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import { ChatMessage } from "@/types/chat";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectIntent, statesFor, Intent } from "@/lib/intent-router";

const generateLocalId = () => "local-" + Math.random().toString(36).slice(2, 10);

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    conversations,
    activeConvId,
    setActiveConvId,
    createConversation,
    updateConversationTitle,
    loadMessages,
    addMessage,
    updateMessage,
    messagesByConv,
    appendLocalMessage,
    patchLocalMessage,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workingState, setWorkingState] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stateRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? (messagesByConv[activeConvId] || []) : [];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }, []);

  const clearTimers = useCallback(() => {
    if (stateRef.current) { clearInterval(stateRef.current); stateRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (activeConvId && !messagesByConv[activeConvId]) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, messagesByConv, loadMessages]);

  // Pending prompt after login
  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem("pending_prompt");
    if (pending) {
      sessionStorage.removeItem("pending_prompt");
      sessionStorage.removeItem("pending_type");
      handleSendMessage({ text: pending, tier: "fast" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const displayTitle = (() => {
    const raw = workingState && !activeConversation?.title
      ? workingState
      : activeConversation?.title ?? "Elite Veo";
    return raw.length > 14 ? raw.slice(0, 14) + "…" : raw;
  })();

  const startStates = (states: string[]) => {
    setWorkingState(states[0]);
    let idx = 0;
    stateRef.current = setInterval(() => {
      if (idx < states.length - 1) {
        idx++;
        setWorkingState(states[idx]);
      }
    }, 1500);
  };

  /* ── SSE streaming helper for any function returning text/event-stream ── */
  const streamSSE = async (
    funcName: string,
    body: any,
    convId: string,
    aiMsgId: string,
    requireAuth: boolean
  ) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${funcName}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (requireAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });

    if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    if (!resp.ok || !resp.body) {
      let detail = "";
      try { detail = (await resp.json())?.error || ""; } catch {}
      throw new Error(detail || `Error (${resp.status})`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";
    let done = false;
    while (!done) {
      const r = await reader.read();
      if (r.done) break;
      buffer += decoder.decode(r.value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { done = true; break; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            acc += content;
            patchLocalMessage(convId, aiMsgId, acc);
            scrollToBottom();
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    return acc;
  };

  /* ── Each intent's flow ── */

  const flowChat = async (convId: string, prompt: string, tier: ModelTier, msgId: string) => {
    const history = [...activeMessages, { role: "user", content: prompt } as any]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
    const acc = await streamSSE("chat", { messages: history, tier }, convId, msgId, false);
    if (acc) await updateMessage(msgId, acc);
  };

  const flowSearch = async (convId: string, prompt: string, msgId: string) => {
    const acc = await streamSSE("web-search", { prompt }, convId, msgId, false);
    if (acc) await updateMessage(msgId, acc);
  };

  const flowImage = async (convId: string, prompt: string, msgId: string) => {
    const { data, error } = await supabase.functions.invoke("generate-image", {
      body: { prompt, conversationId: convId },
    });
    if (error || !data?.url) throw new Error(error?.message || "Image generation failed");
    const md = `![${prompt}](${data.url})`;
    patchLocalMessage(convId, msgId, md);
    await updateMessage(msgId, md);
  };

  const flowEditImage = async (convId: string, prompt: string, imageUrl: string, msgId: string) => {
    const { data, error } = await supabase.functions.invoke("edit-image", {
      body: { prompt, imageUrl, conversationId: convId },
    });
    if (error || !data?.url) throw new Error(error?.message || "Image edit failed");
    const md = `![${prompt}](${data.url})`;
    patchLocalMessage(convId, msgId, md);
    await updateMessage(msgId, md);
  };

  const flowAnalyze = async (convId: string, prompt: string, imageUrl: string, msgId: string) => {
    const { data, error } = await supabase.functions.invoke("analyze", {
      body: { prompt, imageUrl },
    });
    if (error || !data?.result) throw new Error(error?.message || "Analysis failed");
    patchLocalMessage(convId, msgId, data.result);
    await updateMessage(msgId, data.result);
  };

  const handleSendMessage = async (payload: SendPayload) => {
    const { text: content, tier = "fast", attachedImageUrl } = payload;

    // Detect intent first — guests are limited to plain text chat
    const intent: Intent = detectIntent(content, !!attachedImageUrl);

    if (!user && intent !== "chat") {
      sessionStorage.setItem("pending_prompt", content);
      toast({
        title: "Sign in required",
        description: "Image, search and file features require an account.",
      });
      navigate("/login");
      return;
    }

    /* ─────────── GUEST MODE: in-memory text chat only ─────────── */
    if (!user) {
      const guestConvId = activeConvId ?? "guest";
      if (!activeConvId) setActiveConvId(guestConvId);

      const userMsg: ChatMessage = {
        id: generateLocalId(), role: "user", content, timestamp: new Date(),
      };
      appendLocalMessage(guestConvId, userMsg);
      scrollToBottom();

      const aiMsgId = generateLocalId();
      const aiMsg: ChatMessage = {
        id: aiMsgId, role: "assistant", content: "", timestamp: new Date(),
      };
      appendLocalMessage(guestConvId, aiMsg);

      const states = statesFor("chat", content);
      startStates(states);
      setIsLoading(true);

      try {
        const history = [...activeMessages, userMsg]
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));
        await streamSSE("chat", { messages: history, tier: "fast" }, guestConvId, aiMsgId, false);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          patchLocalMessage(guestConvId, aiMsgId, `❌ ${e.message || "Something went wrong"}`);
          toast({ title: "Error", description: e.message, variant: "destructive" });
        }
      } finally {
        clearTimers();
        setWorkingState(null);
        setIsLoading(false);
        scrollToBottom();
      }
      return;
    }

    /* ─────────── AUTHENTICATED MODE ─────────── */
    let convId = activeConvId;
    if (!convId || convId === "guest") {
      const newConv = await createConversation(content);
      if (!newConv) return;
      convId = newConv.id;
      setActiveConvId(convId);
    } else if (activeMessages.length === 0) {
      updateConversationTitle(convId, content);
    }

    // Persist user message (also appends to local state)
    const userBody = attachedImageUrl ? `${content}\n\n![attached](${attachedImageUrl})` : content;
    await addMessage(convId, "user", userBody);
    scrollToBottom();

    const states = statesFor(intent, content);
    startStates(states);
    setIsLoading(true);

    const created = await addMessage(convId, "assistant", "");
    if (!created) { clearTimers(); setIsLoading(false); setWorkingState(null); return; }
    const aiMsgId = created.id;

    try {
      if (intent === "image")            await flowImage(convId, content, aiMsgId);
      else if (intent === "edit-image" && attachedImageUrl)
                                          await flowEditImage(convId, content, attachedImageUrl, aiMsgId);
      else if (intent === "analyze" && attachedImageUrl)
                                          await flowAnalyze(convId, content, attachedImageUrl, aiMsgId);
      else if (intent === "search")      await flowSearch(convId, content, aiMsgId);
      else                                await flowChat(convId, content, tier, aiMsgId);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        const errMsg = `❌ ${e.message || "Something went wrong"}`;
        patchLocalMessage(convId, aiMsgId, errMsg);
        await updateMessage(aiMsgId, errMsg);
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      clearTimers();
      setWorkingState(null);
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleNewChat = () => {
    clearTimers();
    setIsLoading(false);
    setWorkingState(null);
    setActiveConvId(null);
    setSidebarOpen(false);
  };

  const userInitials = user
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "";

  const ProfileAvatar = ({ className }: { className?: string }) =>
    user ? (
      <button
        onClick={() => navigate("/settings")}
        title="Settings"
        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold hover:ring-2 hover:ring-primary/40 transition-all ${className ?? ""}`}
      >
        {userInitials}
      </button>
    ) : null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
        onNewConversation={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile header */}
        <div className="relative flex items-center px-4 h-14 lg:hidden border-b border-border">
          <button
            data-testid="button-open-sidebar"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="absolute inset-x-14 text-center text-sm font-medium text-foreground truncate pointer-events-none">
            {displayTitle}
          </span>

          <div className="flex-1" />

          {user ? (
            <ProfileAvatar />
          ) : (
            <button
              onClick={() => navigate("/signup")}
              className="shrink-0 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Desktop header — profile icon top-right */}
        {user && (
          <div className="hidden lg:flex items-center justify-end px-4 h-12 shrink-0">
            <ProfileAvatar />
          </div>
        )}

        {!activeConversation || activeMessages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={(s) => handleSendMessage({ text: s, tier: "fast" })} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl py-4 pb-2">
              {activeMessages.map((msg, idx) => {
                const isLast = idx === activeMessages.length - 1;
                const showWorking = isLast && msg.role === "assistant" && isLoading ? workingState : null;
                return (
                  <ChatMessageComponent
                    key={msg.id}
                    message={msg}
                    workingState={showWorking}
                  />
                );
              })}
            </div>
          </div>
        )}

        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;
