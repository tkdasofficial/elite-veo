import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePen, LogOut, Settings, Video, FileText, Shield, ChevronUp,
  Search, X, Sparkles, MessageSquare,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
}

type Group = "Today" | "Yesterday" | "Last 7 days" | "Older";

function groupConversations(convs: Conversation[]): Record<Group, Conversation[]> {
  const now = new Date();
  const groups: Record<Group, Conversation[]> = {
    Today: [], Yesterday: [], "Last 7 days": [], Older: [],
  };
  for (const c of convs) {
    if (isToday(c.createdAt)) groups["Today"].push(c);
    else if (isYesterday(c.createdAt)) groups["Yesterday"].push(c);
    else if (isAfter(c.createdAt, subDays(now, 7))) groups["Last 7 days"].push(c);
    else groups["Older"].push(c);
  }
  return groups;
}

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onClose,
}: ChatSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const groups = groupConversations(filtered);
  const groupOrder: Group[] = ["Today", "Yesterday", "Last 7 days", "Older"];

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "";

  const go = (path: string) => {
    setShowUserMenu(false);
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    onClose();
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar border-r border-sidebar-border/50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-[272px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Header: logo + new chat ── */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-3">
          <button
            onClick={() => { onClose(); navigate("/"); }}
            className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-sidebar-accent/40 transition-colors min-w-0"
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md scale-110" aria-hidden />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden ring-1 ring-sidebar-border/60">
                <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
              </div>
            </div>
            <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight truncate">
              Elite Veo
            </span>
          </button>

          <button
            data-testid="button-new-chat"
            onClick={onNewConversation}
            title="New chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>

        {/* ── New chat CTA pill ── */}
        <div className="px-3 pb-2">
          <button
            onClick={onNewConversation}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5 text-left hover:border-primary/50 hover:bg-sidebar-accent transition-all"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-[13px] font-medium text-sidebar-foreground">New chat</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-sidebar-border/70 bg-background/50 px-1.5 text-[10px] font-mono text-sidebar-foreground/50">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* ── Search ── */}
        {conversations.length > 0 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full h-8 rounded-lg bg-sidebar-accent/40 border border-transparent focus:border-primary/40 focus:bg-sidebar-accent/60 pl-8 pr-7 text-[12px] text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-border/50"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Conversation list ── */}
        <ScrollArea className="flex-1 px-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-10 text-center flex flex-col items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-accent/50">
                <MessageSquare className="h-4 w-4 text-sidebar-foreground/40" />
              </div>
              <p className="text-[12px] text-sidebar-foreground/40 leading-relaxed">
                No chats yet.<br />Start by describing an idea.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[12px] text-sidebar-foreground/40">
                No matches for "{query}"
              </p>
            </div>
          ) : (
            <div className="py-1 space-y-4">
              {groupOrder.map((group) => {
                const convs = groups[group];
                if (!convs.length) return null;
                return (
                  <div key={group} className="animate-fade-in">
                    <p className="px-3 py-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.12em]">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {convs.map((conv) => {
                        const active = activeConversationId === conv.id;
                        return (
                          <button
                            key={conv.id}
                            data-testid={`conv-${conv.id}`}
                            onClick={() => onSelectConversation(conv.id)}
                            className={cn(
                              "group relative w-full text-left truncate rounded-lg pl-3 pr-3 py-2 text-[13px] transition-all",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                            )}
                            <span className="block truncate">{conv.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* ── Bottom section ── */}
        <div className="shrink-0 border-t border-sidebar-border/60 bg-sidebar/50">

          {/* My Creations */}
          <div className="px-2 pt-2">
            <button
              onClick={() => go("/my-creations")}
              className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Video className="h-4 w-4 shrink-0 group-hover:text-primary transition-colors" />
              <span className="text-[13px] font-medium">My Creations</span>
            </button>
          </div>

          {/* User profile */}
          {user && (
            <div className="px-2 pt-1 pb-2 relative">
              <button
                data-testid="button-user-profile"
                onClick={() => setShowUserMenu((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                  showUserMenu ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70"
                )}
              >
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/40 blur-md" aria-hidden />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold ring-2 ring-sidebar">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.email}</p>
                </div>
                <ChevronUp
                  className={cn(
                    "h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform shrink-0",
                    showUserMenu ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute bottom-[calc(100%-4px)] left-2 right-2 z-20 rounded-2xl border border-sidebar-border bg-popover shadow-2xl overflow-hidden mb-1 animate-scale-in origin-bottom">

                    <button
                      onClick={() => go("/settings")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      Settings
                    </button>

                    <button
                      onClick={() => go("/my-creations")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Video className="h-4 w-4 shrink-0" />
                      My Creations
                    </button>

                    <div className="h-px bg-sidebar-border mx-3" />

                    <button
                      onClick={() => go("/terms")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      Terms & Conditions
                    </button>

                    <button
                      onClick={() => go("/privacy")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      Privacy Policy
                    </button>

                    <div className="h-px bg-sidebar-border mx-3" />

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Guest CTA */}
          {!user && (
            <div className="px-3 pb-3 pt-2">
              <button
                onClick={() => go("/signup")}
                className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Get Started — it's free
              </button>
              <button
                onClick={() => go("/login")}
                className="w-full mt-1.5 rounded-xl py-2 text-[13px] font-medium text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
