import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ArrowLeft, MessageSquare, MoreHorizontal,
  Pin, Pencil, Trash2, Image as ImageIcon, Video, Music, SquarePen, X,
  ChevronRight, Download, Flag, RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import { toast } from "sonner";

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
function groupConversations(convs: Conversation[], pinnedIds: string[]): Record<Group, Conversation[]> {
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

/* ── Creation fullscreen viewer ── */
interface CreationViewerProps {
  creation: Creation;
  onClose: () => void;
  onViewAll: () => void;
}

const CreationViewer = ({ creation, onClose, onViewAll }: CreationViewerProps) => {
  const mediaUrl = creation.file_url || creation.thumbnail_url || "";

  const handleDownload = () => {
    if (!mediaUrl) return toast.error("No file available to download");
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = creation.title || creation.type;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    toast.success("Download started");
  };

  const handleReport = () => toast.success("Thank you — report submitted");

  const handleRegenerate = () => {
    if (creation.title) sessionStorage.setItem("ev_regen_prompt", creation.title);
    onClose();
    toast.info("Paste your prompt to regenerate");
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium text-white/80 truncate max-w-[180px]">
          {creation.title || creation.type}
        </p>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
        >
          All <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        {creation.type === "image" && mediaUrl ? (
          <img
            src={mediaUrl}
            alt={creation.title || "Image"}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        ) : creation.type === "video" && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-2xl"
          />
        ) : creation.type === "audio" && mediaUrl ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <Music className="h-10 w-10 text-white/60" />
            </div>
            <audio src={mediaUrl} controls className="w-72" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/40">
            <ImageIcon className="h-16 w-16" />
            <p className="text-sm">No preview available</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 px-4 py-5 flex items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors px-5 py-3 min-w-[80px]"
        >
          <Download className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70">Download</span>
        </button>
        <button
          onClick={handleRegenerate}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors px-5 py-3 min-w-[80px]"
        >
          <RefreshCw className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70">Regenerate</span>
        </button>
        <button
          onClick={handleReport}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-destructive/40 transition-colors px-5 py-3 min-w-[80px]"
        >
          <Flag className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70">Report</span>
        </button>
      </div>
    </div>
  );
};

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
  const [viewingCreation, setViewingCreation] = useState<Creation | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
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

  const closeSearch = () => { setSearchOpen(false); setQuery(""); };

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
    if (val) await updateConversationTitle(id, val);
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
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border transition-transform duration-200 lg:relative lg:translate-x-0 lg:w-[260px]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Header: morphs into search bar when open ── */}
        <div className="relative flex items-center h-14 shrink-0 overflow-hidden">

          {/* Normal header */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-between px-4 transition-all duration-250",
              searchOpen ? "opacity-0 pointer-events-none translate-y-[-100%]" : "opacity-100 translate-y-0"
            )}
          >
            <button
              onClick={() => { onClose(); navigate("/"); }}
              className="flex items-center rounded hover:opacity-70 transition-opacity"
            >
              <span className="text-base font-semibold text-sidebar-foreground">Elite Veo</span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              title="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Search header — full width */}
          <div
            className={cn(
              "absolute inset-0 flex items-center gap-2 px-3 transition-all duration-250",
              searchOpen ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-[100%]"
            )}
          >
            <button
              onClick={closeSearch}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-9 rounded-2xl bg-sidebar-accent/70 px-4 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none border border-transparent focus:border-sidebar-border/50 transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Creations strip ── */}
        {user && creationMedia.length > 0 && (
          <div className="shrink-0 px-3 pb-2 pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
                Creations
              </p>
              <button
                onClick={() => go("/my-creations")}
                title="All Creations"
                className="flex items-center gap-0.5 text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
              >
                All
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {creationMedia.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setViewingCreation(c)}
                  title={c.title || c.type}
                  className="shrink-0 relative h-14 w-14 rounded-xl overflow-hidden bg-sidebar-accent border border-sidebar-border/40 hover:border-sidebar-border transition-colors group"
                >
                  {(c.type === "image" || c.type === "video") && c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      alt={c.title || c.type}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : c.type === "video" ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-sidebar-foreground/40" />
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

        {/* ── Conversation list ── */}
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
                                  <span className="block truncate">{truncate(conv.title)}</span>
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
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
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

        {/* ── Bottom area ── */}
        <div className="shrink-0 relative px-3 py-3">
          {!user && (
            <div className="space-y-1 mb-2">
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

          {/* New Chat FAB — bottom right */}
          <div className="flex justify-end">
            <button
              data-testid="button-new-chat"
              onClick={onNewConversation}
              className="flex items-center gap-2 rounded-full bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              <SquarePen className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Fullscreen Creation Viewer ── */}
      {viewingCreation && (
        <CreationViewer
          creation={viewingCreation}
          onClose={() => setViewingCreation(null)}
          onViewAll={() => { setViewingCreation(null); go("/my-creations"); }}
        />
      )}
    </>
  );
};

export default ChatSidebar;
