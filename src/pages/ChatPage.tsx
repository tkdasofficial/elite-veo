import { useState, useRef, useCallback, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageComponent from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import { ChatMessage } from "@/types/chat";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const generateLocalId = () => "local-" + Math.random().toString(36).slice(2, 10);

/* ─────────────────────────────────────────────
   Working state sequences by task type
───────────────────────────────────────────── */
const STATES_CODE     = ["Thinking...", "Planning...", "Building...", "Writing...", "Running...", "Exporting..."];
const STATES_VIDEO    = ["Thinking...", "Analyzing...", "Creating...", "Writing...", "Rendering..."];
const STATES_RESEARCH = ["Thinking...", "Searching...", "Researching...", "Analyzing...", "Working..."];
const STATES_EDIT     = ["Thinking...", "Analyzing...", "Editing...", "Working..."];
const STATES_DEFAULT  = ["Thinking...", "Analyzing...", "Working...", "Creating..."];

function getWorkingStates(prompt: string, isEdit: boolean): string[] {
  if (isEdit) return STATES_EDIT;
  const p = prompt.toLowerCase();
  if (/html|css|javascript|website|code|app|build|create a\s+\w+\s+(site|page|app)/.test(p)) return STATES_CODE;
  if (/video|script|hook|reel|tiktok|shorts|youtube|content/.test(p)) return STATES_VIDEO;
  if (/research|find|search|what is|how to|explain|tell me|why/.test(p)) return STATES_RESEARCH;
  return STATES_DEFAULT;
}

/* Placeholder AI reply — to be replaced by edge function call */
function buildAIContent(prompt: string): string {
  return `I received your message:\n\n> ${prompt}\n\nThis is a placeholder reply. Wire up an AI edge function to generate real responses.`;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;
  const activeMessages = activeConvId ? (messagesByConv[activeConvId] || []) : [];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }, []);

  const clearTimers = useCallback(() => {
    if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null; }
    if (stateRef.current)  { clearInterval(stateRef.current);  stateRef.current  = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Load messages when active conversation changes
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
      handleSendMessage(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const displayTitle = (() => {
    const raw = workingState && !activeConversation?.title
      ? workingState
      : activeConversation?.title ?? "Elite Veo";
    return raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
  })();

  const startAIReply = async (convId: string, prompt: string, isEdit: boolean) => {
    clearTimers();
    setIsLoading(true);

    const states = getWorkingStates(prompt, isEdit);
    setWorkingState(states[0]);

    // Create assistant DB row immediately so streaming has a stable id
    const created = await addMessage(convId, "assistant", "");
    if (!created) {
      setIsLoading(false);
      setWorkingState(null);
      return;
    }
    const aiMsgId = created.id;

    // Cycle through states
    let stateIdx = 1;
    setWorkingState(states[1] ?? states[0]);
    stateRef.current = setInterval(() => {
      if (stateIdx < states.length - 1) {
        stateIdx++;
        setWorkingState(states[stateIdx]);
      }
    }, 1800);

    // Stream content line by line
    const lines = buildAIContent(prompt).split("\n");
    let linePos = 0;

    streamRef.current = setInterval(() => {
      if (linePos >= lines.length) {
        clearTimers();
        setWorkingState(null);
        setIsLoading(false);
        // Persist final content
        const finalContent = lines.join("\n");
        updateMessage(aiMsgId, finalContent);
        scrollToBottom();
        return;
      }
      linePos++;
      const partial = lines.slice(0, linePos).join("\n");
      patchLocalMessage(convId, aiMsgId, partial);
      scrollToBottom();
    }, 110);
  };

  const handleSendMessage = async (content: string) => {
    if (!user) {
      sessionStorage.setItem("pending_prompt", content);
      navigate("/login");
      return;
    }

    const isEdit = !!activeConvId;
    let convId = activeConvId;

    if (!convId) {
      const newConv = await createConversation(content);
      if (!newConv) return;
      convId = newConv.id;
      setActiveConvId(convId);
    } else if (activeMessages.length === 0) {
      // first message in an existing empty convo → set title
      updateConversationTitle(convId, content);
    }

    // Optimistically render the user message immediately
    const tempUserMsg: ChatMessage = {
      id: generateLocalId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    appendLocalMessage(convId, tempUserMsg);
    scrollToBottom();

    // Persist user message (DB row will replace optimistic one in messagesByConv via addMessage)
    await addMessage(convId, "user", content);

    // Trigger AI reply
    startAIReply(convId, content, isEdit);
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
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
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
