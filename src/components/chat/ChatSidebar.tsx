import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePen, LogOut, Settings, Video, FileText, Shield, ChevronUp,
  Search, X, MessageSquare,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import Logo from "@/components/Logo";

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
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:relative lg:translate-x-0 lg:w-[260px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-14 shrink-0">
          <button
            onClick={() => { onClose(); navigate("/"); }}
            className="flex items-center gap-2 px-1 rounded hover:opacity-70 transition-opacity min-w-0"
          >
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
              <Logo />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              Elite Veo
            </span>
          </button>

          <button
            data-testid="button-new-chat"
            onClick={onNewConversation}
            title="New chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        {conversations.length > 0 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full h-8 rounded-lg bg-sidebar-accent/50 border-0 pl-8 pr-7 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-sidebar-border transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-12 text-center">
              <MessageSquare className="h-5 w-5 text-sidebar-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-sidebar-foreground/40">No chats yet</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-sidebar-foreground/40">No matches for "{query}"</p>
            </div>
          ) : (
            <div className="py-1 space-y-3">
              {groupOrder.map((group) => {
                const convs = groups[group];
                if (!convs.length) return null;
                return (
                  <div key={group}>
                    <p className="px-3 py-1 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
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
                              "w-full text-left truncate rounded-lg px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            )}
                          >
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

        {/* Bottom section */}
        <div className="shrink-0 border-t border-sidebar-border px-2 py-2 space-y-0.5">

          <button
            onClick={() => go("/my-creations")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Video className="h-4 w-4 shrink-0" />
            My Creations
          </button>

          {user && (
            <div className="relative">
              <button
                data-testid="button-user-profile"
                onClick={() => setShowUserMenu((v) => !v)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
                  showUserMenu ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/70"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                  {initials}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-sidebar-foreground truncate">{user.name}</p>
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
                  <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 z-20 rounded-xl border border-sidebar-border bg-popover shadow-lg overflow-hidden">
                    <button
                      onClick={() => go("/settings")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      Settings
                    </button>
                    <button
                      onClick={() => go("/my-creations")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Video className="h-4 w-4 shrink-0" />
                      My Creations
                    </button>
                    <div className="h-px bg-sidebar-border mx-3" />
                    <button
                      onClick={() => go("/terms")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      Terms
                    </button>
                    <button
                      onClick={() => go("/privacy")}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      Privacy
                    </button>
                    <div className="h-px bg-sidebar-border mx-3" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!user && (
            <div className="pt-1 pb-1 space-y-1">
              <button
                onClick={() => go("/signup")}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get Started
              </button>
              <button
                onClick={() => go("/login")}
                className="w-full rounded-lg py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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
