import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Archive, Trash2, Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const DataControls = () => {
  const navigate = useNavigate();
  const { conversations, deleteConversation } = useApp();
  const [deleting, setDeleting]             = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      appVersion: "1.0.0",
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
      })),
      customInstructions: {
        enabled: JSON.parse(localStorage.getItem("ev_ci_enabled") ?? "false"),
        about:   localStorage.getItem("ev_ci_about") ?? "",
        style:   localStorage.getItem("ev_ci_style") ?? "",
      },
      memories: JSON.parse(localStorage.getItem("ev_memories") ?? "[]"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `elite-veo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const deleteAllChats = async () => {
    if (!deleteConfirmed) { setDeleteConfirmed(true); return; }
    setDeleting(true);
    for (const c of conversations) await deleteConversation(c.id);
    setDeleting(false);
    setDeleteConfirmed(false);
    toast.success("All chats deleted");
    navigate("/settings");
  };

  return (
    <SettingsPage title="Data Controls" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 space-y-5 max-w-md mx-auto w-full">

        {/* Export */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Export
          </p>
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Download className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Export your data</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Download a JSON copy of your conversations, memories, and settings.
                </p>
              </div>
            </div>
            <button
              onClick={exportData}
              className="w-full rounded-xl bg-secondary hover:bg-secondary/70 py-2.5 text-sm font-semibold text-foreground transition-colors active:scale-[0.98]"
            >
              Download my data
            </button>
          </div>
        </div>

        {/* Archive */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Archive
          </p>
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Archive className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Archive all chats</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Move all conversations out of view without deleting them. Coming soon.
                </p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Archiving is coming in a future update")}
              className="w-full rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground/50 transition-colors cursor-not-allowed"
              disabled
            >
              Archive all chats
            </button>
          </div>
        </div>

        {/* Delete chats */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
            Delete
          </p>
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Delete all chats</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Permanently remove all conversations and messages. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={deleteAllChats}
              disabled={deleting}
              className={[
                "w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
                deleteConfirmed
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-secondary text-foreground hover:bg-secondary/70",
              ].join(" ")}
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </span>
              ) : deleteConfirmed ? (
                "Tap again to confirm deletion"
              ) : (
                `Delete all chats (${conversations.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </SettingsPage>
  );
};

export default DataControls;
