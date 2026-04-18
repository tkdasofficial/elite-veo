import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { SettingsPage, Toggle, ls } from "@/components/settings/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CustomInstructions = () => {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(() => ls.get("ev_ci_enabled", false));
  const [about, setAbout]     = useState(() => ls.get("ev_ci_about", ""));
  const [style, setStyle]     = useState(() => ls.get("ev_ci_style", ""));

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    ls.set("ev_ci_enabled", next);
  };

  const save = () => {
    ls.set("ev_ci_about", about);
    ls.set("ev_ci_style", style);
    ls.set("ev_ci_enabled", enabled);
    toast.success("Custom instructions saved");
    navigate("/settings");
  };

  return (
    <SettingsPage
      title="Custom Instructions"
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
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
          <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Custom instructions are applied to every conversation when enabled. The AI will
            use this context to give you more relevant and personalised responses.
          </p>
        </div>

        {/* About you */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            What should Elite Veo know about you?
          </Label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="e.g. I'm a filmmaker based in Mumbai working on short-form social content..."
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/40 text-right">
            {about.length} / 1500
          </p>
        </div>

        {/* Response style */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            How should Elite Veo respond?
          </Label>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="e.g. Be concise and direct. Use bullet points. Explain your reasoning briefly..."
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/40 text-right">
            {style.length} / 1500
          </p>
        </div>

        <Button onClick={save} className="w-full rounded-xl h-11">
          Save instructions
        </Button>
      </div>
    </SettingsPage>
  );
};

export default CustomInstructions;
