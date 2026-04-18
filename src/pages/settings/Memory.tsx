import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Brain } from "lucide-react";
import { SettingsPage, Toggle, ls } from "@/components/settings/shared";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Memory { id: string; text: string; createdAt: string; }

const MemoryPage = () => {
  const navigate = useNavigate();
  const [enabled, setEnabled]   = useState(() => ls.get("ev_memory_enabled", true));
  const [memories, setMemories] = useState<Memory[]>(() => ls.get("ev_memories", []));
  const [newText, setNewText]   = useState("");

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    ls.set("ev_memory_enabled", next);
    toast.success(next ? "Memory enabled" : "Memory disabled");
  };

  const addMemory = () => {
    if (!newText.trim()) return;
    const m: Memory = {
      id: Date.now().toString(),
      text: newText.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [m, ...memories];
    setMemories(next);
    ls.set("ev_memories", next);
    setNewText("");
    toast.success("Memory saved");
  };

  const deleteMemory = (id: string) => {
    const next = memories.filter((m) => m.id !== id);
    setMemories(next);
    ls.set("ev_memories", next);
  };

  const clearAll = () => {
    setMemories([]);
    ls.set("ev_memories", []);
    toast.success("All memories cleared");
  };

  return (
    <SettingsPage
      title="Memory"
      onBack={() => navigate("/settings")}
      trailing={
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            {enabled ? "On" : "Off"}
          </span>
          <Toggle on={enabled} onToggle={toggleEnabled} />
        </div>
      }
    >
      <div className="px-4 pt-5 pb-10 space-y-5 max-w-md mx-auto w-full">
        {/* Info */}
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            When memory is on, Elite Veo remembers things you share across conversations.
            Memories are stored locally on this device.
          </p>
        </div>

        {/* Add memory */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-1">
            Add a memory
          </p>
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. I prefer formal English"
              className="rounded-xl flex-1"
              onKeyDown={(e) => e.key === "Enter" && addMemory()}
            />
            <button
              onClick={addMemory}
              disabled={!newText.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Memory list */}
        {memories.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                Saved memories ({memories.length})
              </p>
              <button
                onClick={clearAll}
                className="text-xs text-destructive hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex h-6 w-6 shrink-0 mt-0.5 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-3 w-3 text-primary" />
                  </div>
                  <p className="flex-1 text-sm text-foreground leading-relaxed">{m.text}</p>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="shrink-0 mt-0.5 text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground/30">
            <Brain className="h-10 w-10" />
            <p className="text-sm">No memories saved yet</p>
          </div>
        )}
      </div>
    </SettingsPage>
  );
};

export default MemoryPage;
