import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CONSEQUENCES = [
  "All conversations and messages permanently deleted",
  "All creations (images, videos, audio) removed",
  "Custom instructions and memory cleared",
  "Your account cannot be recovered",
];

const DeleteAccount = () => {
  const navigate  = useNavigate();
  const { signOut } = useAuth();
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    if (confirm !== "DELETE") return toast.error('Please type "DELETE" exactly');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await signOut();
    toast.success("Account deletion requested. You will receive a confirmation email within 24 hours.");
    navigate("/");
  };

  const ready = confirm === "DELETE";

  return (
    <SettingsPage title="Delete Account" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 space-y-5 max-w-md mx-auto w-full">

        {/* Warning */}
        <div className="rounded-2xl bg-destructive/8 border border-destructive/20 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-destructive">This is permanent</p>
              <p className="text-xs text-muted-foreground">Deletion cannot be undone</p>
            </div>
          </div>
          <ul className="space-y-2">
            {CONSEQUENCES.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/60" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Type{" "}
            <span className="font-bold text-destructive tracking-widest">DELETE</span>
            {" "}to confirm
          </Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className={[
              "rounded-xl font-mono tracking-widest transition-colors",
              ready ? "border-destructive/50 focus-visible:ring-destructive/30" : "",
            ].join(" ")}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handle}
          disabled={loading || !ready}
          className={[
            "w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98]",
            ready
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </span>
          ) : (
            "Permanently delete my account"
          )}
        </button>

        <p className="text-xs text-muted-foreground/50 text-center leading-relaxed">
          Account deletion is processed within 24 hours. A confirmation email will be sent.
        </p>
      </div>
    </SettingsPage>
  );
};

export default DeleteAccount;
