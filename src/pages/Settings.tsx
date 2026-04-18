import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Bell, Shield, Palette, LogOut, ChevronRight,
  Check, Monitor, Sun, Moon, KeyRound, Loader2, ShieldCheck, FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import OtpInput from "@/components/auth/OtpInput";

const SettingsRow = ({
  icon: Icon, label, sublabel, onClick, danger, trailing,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={[
      "flex w-full items-center gap-4 px-4 py-4 text-left transition-colors",
      danger
        ? "text-destructive hover:bg-destructive/5"
        : "text-foreground hover:bg-secondary/40",
    ].join(" ")}
  >
    <Icon className="h-5 w-5 shrink-0 text-current opacity-80" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
    {trailing ?? <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
  </button>
);

const NOTIF_KEY = "app-notifications";
const readNotifs = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{"push":true,"email":true}');
  } catch {
    return { push: true, email: true };
  }
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const themeLabel =
    theme === "system" ? "System default" : theme === "light" ? "Light" : "Dark";

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 h-14 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-sm font-semibold text-foreground pr-8">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* Profile card */}
        {user && (
          <div className="flex flex-col items-center py-6 px-4 mb-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold mb-3">
              {initials}
            </div>
            <p className="text-base font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        )}

        {/* Account section */}
        <div className="px-4 mb-3">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1 px-1">Account</p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/30">
            <SettingsRow
              icon={User}
              label="Edit Profile"
              sublabel="Name, display preferences"
              onClick={() => setProfileOpen(true)}
            />
            <SettingsRow
              icon={KeyRound}
              label="Change Password"
              sublabel="Update via email verification"
              onClick={() => setPwOpen(true)}
            />
            <SettingsRow
              icon={Bell}
              label="Notifications"
              sublabel="Push and email preferences"
              onClick={() => setNotifOpen(true)}
            />
          </div>
        </div>

        {/* App section */}
        <div className="px-4 mb-3">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1 px-1">App</p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/30">
            <SettingsRow
              icon={Palette}
              label="Appearance"
              sublabel={themeLabel}
              onClick={() => setAppearanceOpen(true)}
            />
            <SettingsRow
              icon={FileText}
              label="Terms & Conditions"
              onClick={() => navigate("/terms")}
            />
            <SettingsRow
              icon={Shield}
              label="Privacy Policy"
              onClick={() => navigate("/privacy")}
            />
          </div>
        </div>

        {/* Sign out */}
        <div className="px-4 mb-3">
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <SettingsRow icon={LogOut} label="Sign Out" onClick={handleSignOut} danger />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/30 mt-4">Elite Veo v1.0.0</p>
      </div>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <NotificationsDialog open={notifOpen} onOpenChange={setNotifOpen} />
      <AppearanceDialog open={appearanceOpen} onOpenChange={setAppearanceOpen} theme={theme} setTheme={setTheme} />
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
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
          <DialogDescription>Update your display name. Email cannot be changed here.</DialogDescription>
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

/* ── Notifications ── */
const NotificationsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [prefs, setPrefs] = useState(readNotifs);

  const update = (key: "push" | "email", value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    toast.success("Preferences saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Choose how you'd like to be notified.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-xs text-muted-foreground">Alerts inside the app</p>
            </div>
            <Switch checked={prefs.push} onCheckedChange={(v) => update("push", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Updates sent to your inbox</p>
            </div>
            <Switch checked={prefs.email} onCheckedChange={(v) => update("email", v)} />
          </div>
        </div>
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
                onClick={() => setTheme(value)}
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

  const reset = () => {
    setStage("intro");
    setOtpError("");
    setPw("");
    setPw2("");
    setLoading(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

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
    if (error) {
      setOtpError(error);
      return;
    }
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

export default Settings;
