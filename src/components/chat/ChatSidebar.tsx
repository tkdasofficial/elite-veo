import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SquarePen, LogOut, Settings, Video, FileText, Shield, ChevronUp,
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
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
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

  const groups = groupConversations(conversations);
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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Top: logo + new chat ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg overflow-hidden shrink-0">
              <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
            </div>
            <span className="text-[13px] font-semibold text-sidebar-foreground">Elite Veo</span>
          </div>
          <button
            data-testid="button-new-chat"
            onClick={onNewConversation}
            title="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>

        {/* ── Conversation list ── */}
        <ScrollArea className="flex-1 px-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-[12px] text-sidebar-foreground/30 leading-relaxed">
                No chats yet.<br />Start by describing a video idea.
              </p>
            </div>
          ) : (
            <div className="py-1 space-y-4">
              {groupOrder.map((group) => {
                const convs = groups[group];
                if (!convs.length) return null;
                return (
                  <div key={group}>
                    <p className="px-3 py-1 text-[11px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {convs.map((conv) => (
                        <button
                          key={conv.id}
                          data-testid={`conv-${conv.id}`}
                          onClick={() => onSelectConversation(conv.id)}
                          className={cn(
                            "w-full text-left truncate rounded-lg px-3 py-2 text-[13px] transition-colors",
                            activeConversationId === conv.id
                              ? "bg-sidebar-accent text-sidebar-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          )}
                        >
                          {conv.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* ── Bottom section ── */}
        <div className="shrink-0 border-t border-sidebar-border">

          {/* My Creations — always visible */}
          <div className="px-2 pt-2">
            <button
              onClick={() => go("/my-creations")}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Video className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium">My Creations</span>
            </button>
          </div>

          {/* User profile row — only when logged in */}
          {user && (
            <div className="px-2 pt-1 pb-2 relative">
              <button
                data-testid="button-user-profile"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-sidebar-accent transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                  {initials}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-sidebar-foreground/40 truncate">{user.email}</p>
                </div>
                <ChevronUp
                  className={cn(
                    "h-3.5 w-3.5 text-sidebar-foreground/30 transition-transform shrink-0",
                    showUserMenu ? "rotate-0" : "rotate-180"
                  )}
                />
              </button>

              {/* User popup menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute bottom-[calc(100%-8px)] left-2 right-2 z-20 rounded-2xl border border-sidebar-border bg-popover shadow-xl overflow-hidden mb-1">

                    <button
                      onClick={() => go("/settings")}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      Settings
                    </button>

                    <button
                      onClick={() => go("/my-creations")}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Video className="h-4 w-4 shrink-0" />
                      My Creations
                    </button>

                    <div className="h-px bg-sidebar-border mx-3" />

                    <button
                      onClick={() => go("/terms")}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      Terms & Conditions
                    </button>

                    <button
                      onClick={() => go("/privacy")}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      Privacy Policy
                    </button>

                    <div className="h-px bg-sidebar-border mx-3" />

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] text-destructive hover:bg-destructive/8 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Guest bottom CTA */}
          {!user && (
            <div className="px-3 pb-3 pt-1">
              <button
                onClick={() => go("/signup")}
                className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={() => go("/login")}
                className="w-full mt-1.5 rounded-xl py-2 text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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
