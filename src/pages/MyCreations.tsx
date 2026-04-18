import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Image as ImageIcon, Video, Music, FileText,
  Plus, Download, Flag, RefreshCw, X, Play,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Creation {
  id: string;
  type: "image" | "video" | "audio" | "text";
  title: string | null;
  prompt: string | null;
  content: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

type FilterTab = "All" | "Images" | "Videos" | "Audio" | "Text";

const TAB_FILTERS: Record<FilterTab, (c: Creation) => boolean> = {
  All: () => true,
  Images: (c) => c.type === "image",
  Videos: (c) => c.type === "video",
  Audio: (c) => c.type === "audio",
  Text: (c) => c.type === "text",
};

const TABS: FilterTab[] = ["All", "Images", "Videos", "Audio", "Text"];

/* ──────────────── Fullscreen Viewer ──────────────── */
const CreationViewer = ({
  creation,
  onClose,
}: {
  creation: Creation;
  onClose: () => void;
}) => {
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
    if (creation.title || creation.prompt) {
      sessionStorage.setItem("ev_regen_prompt", creation.title || creation.prompt || "");
    }
    onClose();
    toast.info("Prompt saved — paste it to regenerate");
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
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
        <p className="text-sm font-medium text-white/80 truncate max-w-[220px] text-center">
          {creation.title || creation.prompt || creation.type}
        </p>
        <span className="text-xs text-white/40 capitalize px-2 py-0.5 rounded-full bg-white/10">
          {creation.type}
        </span>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        {creation.type === "image" && mediaUrl ? (
          <img
            src={mediaUrl}
            alt={creation.title || "Image"}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        ) : creation.type === "video" && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-2xl shadow-2xl"
          />
        ) : creation.type === "audio" && mediaUrl ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <Music className="h-12 w-12 text-white/60" />
            </div>
            <audio src={mediaUrl} controls className="w-72 rounded-full" />
          </div>
        ) : creation.type === "text" && creation.content ? (
          <div className="max-w-lg w-full rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 overflow-y-auto max-h-[70vh]">
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {creation.content}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/30">
            <ImageIcon className="h-16 w-16" />
            <p className="text-sm">No preview available</p>
          </div>
        )}
      </div>

      {/* Prompt */}
      {(creation.prompt || creation.title) && (
        <div className="shrink-0 px-4 py-2">
          <p className="text-center text-xs text-white/40 truncate">
            {creation.prompt || creation.title}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="shrink-0 px-4 py-5 flex items-center justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all px-6 py-3.5 min-w-[84px]"
        >
          <Download className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70 font-medium">Download</span>
        </button>
        <button
          onClick={handleRegenerate}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all px-6 py-3.5 min-w-[84px]"
        >
          <RefreshCw className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70 font-medium">Regenerate</span>
        </button>
        <button
          onClick={handleReport}
          className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-red-500/30 active:scale-95 transition-all px-6 py-3.5 min-w-[84px]"
        >
          <Flag className="h-5 w-5 text-white" />
          <span className="text-[11px] text-white/70 font-medium">Report</span>
        </button>
      </div>
    </div>
  );
};

/* ──────────────── Grid Thumbnail ──────────────── */
const CreationTile = ({
  creation,
  onTap,
}: {
  creation: Creation;
  onTap: () => void;
}) => {
  const thumb = creation.thumbnail_url || creation.file_url;

  if (creation.type === "image" || creation.type === "video") {
    return (
      <button
        onClick={onTap}
        className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 group active:scale-95 transition-transform"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={creation.title || creation.type}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
            {creation.type === "video" ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
          </div>
        )}
        {creation.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
        )}
        {creation.title && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white truncate">{creation.title}</p>
          </div>
        )}
      </button>
    );
  }

  /* Audio / Text — full-width list rows */
  const Icon = creation.type === "audio" ? Music : FileText;
  return (
    <button
      onClick={onTap}
      className="col-span-2 flex items-center gap-3 rounded-2xl bg-secondary/30 px-4 py-3.5 text-left active:scale-[0.98] transition-transform hover:bg-secondary/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {creation.title || creation.prompt || "Untitled"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {creation.type} · {new Date(creation.created_at).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
};

/* ──────────────── Main Page ──────────────── */
const MyCreations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [viewing, setViewing] = useState<Creation | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("creations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCreations((data as Creation[]) || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = creations.filter(TAB_FILTERS[activeTab]);

  return (
    <>
      {viewing && <CreationViewer creation={viewing} onClose={() => setViewing(null)} />}

      <div className="h-dvh bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center px-4 h-14 shrink-0 border-b border-border/20">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold text-foreground pr-9">
            All Creations
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border/10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 py-20 text-center">
              <p className="text-base font-semibold text-foreground">Sign in to view your creations</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div className="px-4 pt-4 grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-secondary/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Video className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {activeTab === "All" ? "No creations yet" : `No ${activeTab.toLowerCase()} yet`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "All"
                    ? "Images and generated content will appear here."
                    : `Your ${activeTab.toLowerCase()} will appear here.`}
                </p>
              </div>
              {activeTab === "All" && (
                <button
                  onClick={() => navigate("/")}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" />
                  Create something
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 pt-4 pb-8 grid grid-cols-2 gap-2">
              {filtered.map((c) => (
                <CreationTile key={c.id} creation={c} onTap={() => setViewing(c)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyCreations;
