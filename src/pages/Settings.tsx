import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Palette, LogOut, ChevronRight,
  Check, Monitor, Sun, Moon, KeyRound, Loader2, ShieldCheck,
  Mail, Video, Trash2, Info, FileText, Shield, Pencil,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import OtpInput from "@/components/auth/OtpInput";

const Row = ({
  icon: Icon, label, sublabel, onClick, danger, noArrow,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  noArrow?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={[
      "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors disabled:cursor-default",
      danger
        ? "text-destructive hover:bg-destructive/5"
        : "hover:bg-secondary/40",
    ].join(" ")}
  >
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? "bg-destructive/10" : "bg-secondary"}`}>
      <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-foreground/70"}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sublabel}</p>}
    </div>
    {!noArrow && !danger && onClick && (
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
    )}
  </button>
);

const SectionCard = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <div className="px-4 mb-3">
    {label && (
      <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1 font-medium">
        {label}
      </p>
    )}
    <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { conversations, deleteConversation } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const themeLabel =
    theme === "system" ? "System default" : theme === "light" ? "Light" : "Dark";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAllChats = async () => {
    for (const conv of conversations) {
      await deleteConversation(conv.id);
    }
    toast.success("All chats deleted");
    setDataOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Back arrow only — no title */}
      <div className="flex items-center px-4 h-14 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">

        {/* Avatar + name */}
        {user && (
          <div className="flex flex-col items-center pt-2 pb-6 px-4">
            <div className="relative mb-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold select-none">
                {initials}
              </div>
              <button
                onClick={() => setProfileOpen(true)}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-secondary border-2 border-background text-foreground/70 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            <p className="text-base font-semibold text-foreground">{user.name}</p>
          </div>
        )}

        {/* My Elite Veo */}
        <SectionCard label="My Elite Veo">
          <Row
            icon={Palette}
            label="Personalization"
            sublabel={themeLabel}
            onClick={() => setAppearanceOpen(true)}
          />
          <Row
            icon={Video}
            label="My Creations"
            sublabel="Images, videos & more"
            onClick={() => navigate("/my-creations")}
          />
        </SectionCard>

        {/* Account */}
        <SectionCard label="Account">
          <Row
            icon={Mail}
            label="Email"
            sublabel={user?.email ?? "Not signed in"}
            noArrow
          />
          <Row
            icon={KeyRound}
            label="Change Password"
            onClick={() => setPwOpen(true)}
          />
        </SectionCard>

        {/* General */}
        <SectionCard label="General">
          <Row
            icon={Trash2}
            label="Data Controls"
            sublabel="Delete all chat history"
            onClick={() => setDataOpen(true)}
          />
          <Row
            icon={FileText}
            label="Terms of Service"
            onClick={() => navigate("/terms")}
          />
          <Row
            icon={Shield}
            label="Privacy Policy"
            onClick={() => navigate("/privacy")}
          />
          <Row
            icon={Info}
            label="About"
            sublabel="Elite Veo v1.0.0"
            noArrow
          />
        </SectionCard>

        {/* Log out */}
        <div className="px-4 mb-3">
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <Row icon={LogOut} label="Log out" onClick={handleSignOut} danger noArrow />
          </div>
        </div>
      </div>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} theme={theme} setTheme={setTheme} />
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <DataControlsDialog open={dataOpen} onOpenChange={setDataOpen} onDeleteAll={handleDeleteAllChats} />
    </div>
  );
};

/* ── Edit Profile ── */
const EditProfileDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim(), full_name: name.trim() },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your display name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ── Appearance ── */
const AppearanceDialog = ({
  open, onOpenChange, theme, setTheme,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}) => {
  const options: { value: ThemeMode; label: string; desc: string; icon: React.ElementType }[] = [
    { value: "system", label: "System default", desc: "Match your device setting", icon: Monitor },
    { value: "light", label: "Light", desc: "Bright background", icon: Sun },
    { value: "dark", label: "Dark", desc: "Dark background", icon: Moon },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>Choose the theme used across the app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {options.map(({ value, label, desc, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => { setTheme(value); onOpenChange(false); }}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active ? "border-primary/60 bg-secondary/50" : "border-border hover:bg-secondary/40",
                ].join(" ")}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {active && <Check className="h-4 w-4 text-foreground" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Change Password ── */
const ChangePasswordDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { user, resetPassword, verifyRecoveryOtp, updatePassword } = useAuth();
  const [stage, setStage] = useState<"intro" | "otp" | "new">("intro");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const reset = () => { setStage("intro"); setOtpError(""); setPw(""); setPw2(""); setLoading(false); };
  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const sendOtp = async () => {
    if (!user?.email) return toast.error("No email on this account");
    setLoading(true);
    const { error } = await resetPassword(user.email);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("OTP sent to your email");
    setStage("otp");
  };

  const verifyOtp = async (token: string) => {
    if (!user?.email) return;
    setLoading(true);
    setOtpError("");
    const { error } = await verifyRecoveryOtp(user.email, token);
    setLoading(false);
    if (error) { setOtpError(error); return; }
    setStage("new");
  };

  const saveNewPassword = async () => {
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await updatePassword(pw);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Password updated");
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {stage === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                We'll email a verification code to{" "}
                <span className="font-medium text-foreground">{user?.email}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={sendOtp} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send code
              </Button>
            </DialogFooter>
          </>
        )}
        {stage === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Enter code
              </DialogTitle>
              <DialogDescription>
                Enter the 8-digit code sent to{" "}
                <span className="font-medium text-foreground">{user?.email}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <OtpInput length={8} onComplete={verifyOtp} disabled={loading} error={!!otpError} />
              {otpError && <p className="text-xs text-destructive mt-3 text-center">{otpError}</p>}
              {loading && <p className="text-xs text-muted-foreground mt-3 text-center">Verifying…</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={sendOtp} disabled={loading}>Resend code</Button>
            </DialogFooter>
          </>
        )}
        {stage === "new" && (
          <>
            <DialogHeader>
              <DialogTitle>Set new password</DialogTitle>
              <DialogDescription>Choose a strong password you don't use elsewhere.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="pw">New password</Label>
                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm password</Label>
                <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={saveNewPassword} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update password
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ── Data Controls ── */
const DataControlsDialog = ({
  open, onOpenChange, onDeleteAll,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleteAll: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onDeleteAll();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data controls</DialogTitle>
          <DialogDescription>
            Permanently delete all your chat history. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handle} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Delete all chats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
