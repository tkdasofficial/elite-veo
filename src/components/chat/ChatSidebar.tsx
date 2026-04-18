import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, MessageSquare, MoreHorizontal,
  Pin, Pencil, Trash2, Image as ImageIcon, Video, Music, SquarePen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
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

interface Creation {
  id: string;
  type: "image" | "video" | "audio" | "text";
  title: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
}

type Group = "Pinned" | "Today" | "Yesterday" | "Last 7 days" | "Older";

const PINS_KEY = "ev_pinned_convs";

function getPinned(): string[] {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) || "[]"); } catch { return []; }
}
function setPinned(ids: string[]) {
  localStorage.setItem(PINS_KEY, JSON.stringify(ids));
}

function truncate(str: string, max = 12) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function groupConversations(
  convs: Conversation[],
  pinnedIds: string[]
): Record<Group, Conversation[]> {
  const now = new Date();
  const groups: Record<Group, Conversation[]> = {
    Pinned: [], Today: [], Yesterday: [], "Last 7 days": [], Older: [],
  };
  for (const c of convs) {
    if (pinnedIds.includes(c.id)) { groups["Pinned"].push(c); continue; }
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
  const { user } = useAuth();
  const { deleteConversation, updateConversationTitle } = useApp();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>(getPinned);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creations, setCreations] = useState<Creation[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setQuery("");
  }, [searchOpen]);

  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renamingId]);

  useEffect(() => {
    if (!user) { setCreations([]); return; }
    supabase
      .from("creations")
      .select("id, type, title, file_url, thumbnail_url")
      .eq("user_id", user.id)
      .neq("type", "text")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setCreations((data as Creation[]) || []));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const groups = groupConversations(filtered, pinnedIds);
  const groupOrder: Group[] = ["Pinned", "Today", "Yesterday", "Last 7 days", "Older"];

  const go = (path: string) => { onClose(); navigate(path); };

  const togglePin = (id: string) => {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((p) => p !== id)
      : [id, ...pinnedIds];
    setPinned(next);
    setPinnedIds(next);
    setMenuOpenId(null);
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setMenuOpenId(null);
  };

  const commitRename = async (id: string) => {
    const val = renameValue.trim();
    if (val && val.length > 0) await updateConversationTitle(id, val);
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    await deleteConversation(id);
  };

  const creationMedia = creations.filter((c) => c.type !== "text");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border transition-transform duration-200 lg:relative lg:translate-x-0 lg:w-[260px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-14 shrink-0">
          <button
            onClick={() => { onClose(); navigate("/"); }}
            className="flex items-center px-1 rounded hover:opacity-70 transition-opacity"
          >
            <span className="text-base font-semibold text-sidebar-foreground">
              Elite Veo
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              title="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
            <button
              data-testid="button-new-chat"
              onClick={onNewConversation}
              title="New chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <SquarePen className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search bar — animated expand */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 px-3",
            searchOpen ? "max-h-14 pb-2 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          )}
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40 pointer-events-none" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-9 rounded-xl bg-sidebar-accent/60 pl-8 pr-7 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none border border-transparent focus:border-sidebar-border/60 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Creations strip */}
        {user && creationMedia.length > 0 && (
          <div className="shrink-0 px-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35 mb-1.5">
              Creations
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {creationMedia.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go("/my-creations")}
                  title={c.title || c.type}
                  className="shrink-0 relative h-14 w-14 rounded-xl overflow-hidden bg-sidebar-accent border border-sidebar-border/40 hover:border-sidebar-border transition-colors group"
                >
                  {c.type === "image" && c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      alt={c.title || "Image"}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : c.type === "video" ? (
                    <div className="h-full w-full flex items-center justify-center">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Video className="h-5 w-5 text-sidebar-foreground/40" />
                      )}
                    </div>
                  ) : c.type === "audio" ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Music className="h-5 w-5 text-sidebar-foreground/40" />
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-sidebar-foreground/40" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-16 text-center">
              <MessageSquare className="h-5 w-5 text-sidebar-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-sidebar-foreground/40">No chats yet</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-sidebar-foreground/40">No matches</p>
            </div>
          ) : (
            <div className="py-1 space-y-4">
              {groupOrder.map((group) => {
                const convs = groups[group];
                if (!convs.length) return null;
                return (
                  <div key={group}>
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {convs.map((conv) => {
                        const active = activeConversationId === conv.id;
                        const isPinned = pinnedIds.includes(conv.id);
                        const isRenaming = renamingId === conv.id;
                        const isMenuOpen = menuOpenId === conv.id;

                        return (
                          <div key={conv.id} className="relative group/item">
                            {isRenaming ? (
                              <div className="px-3 py-1.5">
                                <input
                                  ref={renameInputRef}
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => commitRename(conv.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitRename(conv.id);
                                    if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                                  }}
                                  className="w-full rounded-lg bg-sidebar-accent border border-sidebar-border/60 px-2 py-1 text-sm text-sidebar-foreground focus:outline-none focus:border-primary/50"
                                />
                              </div>
                            ) : (
                              <button
                                data-testid={`conv-${conv.id}`}
                                onClick={() => { onSelectConversation(conv.id); onClose(); }}
                                className={cn(
                                  "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors pr-8",
                                  active
                                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                                )}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isPinned && (
                                    <Pin className="h-2.5 w-2.5 shrink-0 text-sidebar-foreground/40 rotate-45" />
                                  )}
                                  <span className="block truncate">
                                    {truncate(conv.title)}
                                  </span>
                                </div>
                              </button>
                            )}

                            {!isRenaming && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(isMenuOpen ? null : conv.id);
                                }}
                                className={cn(
                                  "absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-border/40 transition-colors",
                                  isMenuOpen
                                    ? "opacity-100 bg-sidebar-border/40 text-sidebar-foreground"
                                    : "opacity-0 group-hover/item:opacity-100"
                                )}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-full mt-0.5 z-20 w-40 rounded-xl border border-sidebar-border bg-popover shadow-xl overflow-hidden">
                                  <button
                                    onClick={() => togglePin(conv.id)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                                  >
                                    <Pin className="h-3.5 w-3.5 shrink-0" />
                                    {isPinned ? "Unpin" : "Pin"}
                                  </button>
                                  <button
                                    onClick={() => startRename(conv)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5 shrink-0" />
                                    Rename
                                  </button>
                                  <div className="h-px bg-sidebar-border mx-2" />
                                  <button
                                    onClick={() => handleDelete(conv.id)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Bottom — unauthenticated only */}
        {!user && (
          <div className="shrink-0 border-t border-sidebar-border px-3 py-3 space-y-1">
            <button
              onClick={() => go("/signup")}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started — it's free
            </button>
            <button
              onClick={() => go("/login")}
              className="w-full rounded-xl py-2 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default ChatSidebar;
