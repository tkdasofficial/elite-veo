import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ChevronDown, Check, Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORIES = [
  "UI / Display issue",
  "AI response problem",
  "Performance / Speed",
  "Account or Auth",
  "Image / Video generation",
  "Audio feature",
  "Crash or error message",
  "Other",
];

const BugReport = () => {
  const navigate = useNavigate();
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [showCats, setShowCats]   = useState(false);
  const [sending, setSending]     = useState(false);

  const submit = async () => {
    if (!description.trim()) return toast.error("Please describe the issue");
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    toast.success("Bug report submitted — thank you! We'll look into it.");
    navigate("/settings");
  };

  return (
    <SettingsPage title="Report a Bug" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 space-y-5 max-w-md mx-auto w-full">

        {/* Info */}
        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
          <Bug className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Found something broken? Your report helps us fix it fast. Be as specific as
            possible — what you did, what you expected, and what happened instead.
          </p>
        </div>

        {/* Category picker */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Category
          </Label>
          <div className="relative">
            <button
              onClick={() => setShowCats((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground"
            >
              <span>{category}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showCats ? "rotate-180" : ""}`}
              />
            </button>
            {showCats && (
              <div className="absolute z-20 mt-1 w-full rounded-xl bg-popover border border-border/30 shadow-xl overflow-hidden">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setShowCats(false); }}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
                  >
                    {c}
                    {category === c && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Description
          </Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            maxLength={2000}
            placeholder="Step-by-step: what did you do? What did you expect to happen? What happened instead?"
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/40 text-right">
            {description.length} / 2000
          </p>
        </div>

        <Button
          onClick={submit}
          disabled={sending || !description.trim()}
          className="w-full rounded-xl h-11"
        >
          {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit report
        </Button>
      </div>
    </SettingsPage>
  );
};

export default BugReport;
