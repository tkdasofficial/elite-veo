import { useState, useRef, useCallback, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageComponent from "@/components/chat/ChatMessage";
import ChatInput, { ModelTier } from "@/components/chat/ChatInput";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import { ChatMessage } from "@/types/chat";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const generateLocalId = () => "local-" + Math.random().toString(36).slice(2, 10);

const STATES_IMAGE    = ["Thinking...", "Designing...", "Generating...", "Rendering..."];
const STATES_RESEARCH = ["Thinking...", "Searching...", "Researching...", "Analyzing..."];
const STATES_DEFAULT  = ["Thinking...", "Analyzing...", "Working..."];

const IMAGE_INTENT = /\b(generate|create|make|draw|paint|design|render|produce)\b.*\b(image|picture|photo|art|illustration|logo|poster|wallpaper|portrait|scene)\b|^(image|picture|photo|art) of\b/i;

function isImageRequest(prompt: string) {
  return IMAGE_INTENT.test(prompt);
}

function getWorkingStates(prompt: string, isImage: boolean): string[] {
  if (isImage) return STATES_IMAGE;
  const p = prompt.toLowerCase();
  if (/research|find|search|what is|how to|explain|tell me|why/.test(p)) return STATES_RESEARCH;
  return STATES_DEFAULT;
}

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

  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem("pending_prompt");
    if (pending) {
      sessionStorage.removeItem("pending_prompt");
      sessionStorage.removeItem("pending_type");
      handleSendMessage(pending, "fast");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const displayTitle = (() => {
    const raw = workingState && !activeConversation?.title
      ? workingState
      : activeConversation?.title ?? "Elite Veo";
    return raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
  })();

  const cycleStates = (states: string[]) => {
    setWorkingState(states[0]);
    let idx = 0;
    stateRef.current = setInterval(() => {
      if (idx < states.length - 1) {
        idx++;
        setWorkingState(states[idx]);
      }
    }, 1800);
  };

  /* ── IMAGE FLOW ────────────────────────────────── */
  const handleImageGen = async (convId: string, prompt: string) => {
    cycleStates(STATES_IMAGE);
    setIsLoading(true);

    const created = await addMessage(convId, "assistant", "Generating image…");
    if (!created) { setIsLoading(false); setWorkingState(null); return; }

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, conversationId: convId },
      });
      if (error || !data?.url) throw new Error(error?.message || "Image generation failed");

      const md = `![${prompt}](${data.url})`;
      patchLocalMessage(convId, created.id, md);
      await updateMessage(created.id, md);
    } catch (e: any) {
      console.error(e);
      const errMsg = `❌ Image generation failed: ${e.message || "unknown error"}`;
      patchLocalMessage(convId, created.id, errMsg);
      await updateMessage(created.id, errMsg);
      toast({ title: "Image failed", description: e.message, variant: "destructive" });
    } finally {
      clearTimers();
      setWorkingState(null);
      setIsLoading(false);
      scrollToBottom();
    }
  };

  /* ── TEXT STREAMING FLOW ──────────────────────── */
  const handleTextStream = async (convId: string, prompt: string, tier: ModelTier) => {
    cycleStates(getWorkingStates(prompt, false));
    setIsLoading(true);

    const created = await addMessage(convId, "assistant", "");
    if (!created) { setIsLoading(false); setWorkingState(null); return; }
    const aiMsgId = created.id;

    // Build conversation history for the model
    const history = [...activeMessages, { role: "user", content: prompt } as any]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: history, tier }),
        signal: controller.signal,
      });

      if (resp.status === 429) throw new Error("Rate limit exceeded — try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted.");
      if (!resp.ok || !resp.body) throw new Error(`AI error (${resp.status})`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { streamDone = true; break; }
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

      if (acc) await updateMessage(aiMsgId, acc);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        const errMsg = `❌ ${e.message || "Something went wrong"}`;
        patchLocalMessage(convId, aiMsgId, errMsg);
        await updateMessage(aiMsgId, errMsg);
        toast({ title: "Chat error", description: e.message, variant: "destructive" });
      }
    } finally {
      clearTimers();
      setWorkingState(null);
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSendMessage = async (content: string, tier: ModelTier = "fast") => {
    if (!user) {
      sessionStorage.setItem("pending_prompt", content);
      navigate("/login");
      return;
    }

    let convId = activeConvId;
    if (!convId) {
      const newConv = await createConversation(content);
      if (!newConv) return;
      convId = newConv.id;
      setActiveConvId(convId);
    } else if (activeMessages.length === 0) {
      updateConversationTitle(convId, content);
    }

    const tempUserMsg: ChatMessage = {
      id: generateLocalId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    appendLocalMessage(convId, tempUserMsg);
    scrollToBottom();
    await addMessage(convId, "user", content);

    if (isImageRequest(content)) {
      await handleImageGen(convId, content);
    } else {
      await handleTextStream(convId, content, tier);
    }
  };

  const handleNewChat = () => {
    clearTimers();
    setIsLoading(false);
    setWorkingState(null);
    setActiveConvId(null);
    setSidebarOpen(false);
  };

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
        <div className="relative flex items-center px-4 py-3 lg:hidden border-b border-border/20">
          <button
            data-testid="button-open-sidebar"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="absolute inset-x-14 text-center text-sm font-semibold text-foreground truncate pointer-events-none transition-all duration-300">
            {displayTitle}
          </span>

          <div className="flex-1" />

          {user ? (
            <button
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-sm"
            >
              {user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </button>
          ) : (
            <button
              onClick={() => navigate("/signup")}
              className="shrink-0 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </button>
          )}
        </div>

        {!activeConversation || activeMessages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={(s) => handleSendMessage(s, "fast")} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl py-4 pb-2">
              {activeMessages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        )}

        {workingState && (
          <div className="shrink-0 flex items-center gap-2 px-5 py-2 border-t border-border/10 bg-background/80">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 130}ms` }}
                />
              ))}
            </span>
            <span className="text-[12px] font-medium text-primary/80 tracking-wide">
              {workingState}
            </span>
          </div>
        )}

        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;
