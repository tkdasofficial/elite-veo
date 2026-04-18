import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Palette, LogOut, Check, Monitor, Sun, Moon,
  KeyRound, Loader2, ShieldCheck, Mail, Video, Trash2,
  Info, FileText, Shield, Pencil,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import OtpInput from "@/components/auth/OtpInput";

type View =
  | "main"
  | "profile"
  | "personalization"
  | "password"
  | "data"
  | "terms"
  | "privacy"
  | "about";

/* ── Shared sub-page wrapper ── */
const SubPage = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) => (
  <div className="h-dvh bg-background flex flex-col">
    <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-border/20">
      <button
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

/* ── Row component ── */
const Row = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
  noArrow,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  noArrow?: boolean;
  trailing?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={[
      "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors disabled:cursor-default",
      danger ? "hover:bg-destructive/5" : "hover:bg-secondary/40",
    ].join(" ")}
  >
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        danger ? "bg-destructive/10" : "bg-secondary"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${danger ? "text-destructive" : "text-foreground/70"}`}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>
        {label}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
    {trailing}
    {!noArrow && !danger && onClick && !trailing && (
      <ArrowLeft className="h-4 w-4 text-muted-foreground/30 rotate-180 shrink-0" />
    )}
  </button>
);

const SectionCard = ({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => (
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

const textSection = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

/* ══════════════════════════════════════════ */
const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { conversations, deleteConversation } = useApp();

  const [view, setView] = useState<View>("main");

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const themeLabel =
    theme === "system" ? "System default" : theme === "light" ? "Light" : "Dark";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const back = useCallback(() => setView("main"), []);

  /* ── Sub-views ── */

  if (view === "profile") {
    return <ProfileView onBack={back} />;
  }

  if (view === "personalization") {
    return (
      <SubPage title="Personalization" onBack={back}>
        <div className="px-4 pt-6 space-y-2">
          {(
            [
              { value: "system", label: "System default", desc: "Match your device setting", icon: Monitor },
              { value: "light", label: "Light", desc: "Bright background", icon: Sun },
              { value: "dark", label: "Dark", desc: "Dark background", icon: Moon },
            ] as { value: ThemeMode; label: string; desc: string; icon: React.ElementType }[]
          ).map(({ value, label, desc, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={[
                  "flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                  active
                    ? "border-primary/50 bg-secondary/60"
                    : "border-border/30 bg-secondary/20 hover:bg-secondary/40",
                ].join(" ")}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {active && <Check className="h-4 w-4 text-foreground shrink-0" />}
              </button>
            );
          })}
        </div>
      </SubPage>
    );
  }

  if (view === "password") {
    return <PasswordView onBack={back} />;
  }

  if (view === "data") {
    return (
      <SubPage title="Data Controls" onBack={back}>
        <div className="px-4 pt-6">
          <div className="rounded-2xl bg-secondary/30 p-5 mb-4">
            <p className="text-sm font-medium text-foreground mb-1">Delete all chat history</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              This will permanently delete all your conversations and messages. This action cannot be undone.
            </p>
            <DeleteAllChatsButton conversations={conversations} deleteConversation={deleteConversation} onDone={back} />
          </div>
        </div>
      </SubPage>
    );
  }

  if (view === "terms") {
    return (
      <SubPage title="Terms of Service" onBack={back}>
        <div className="px-5 py-6 max-w-2xl mx-auto w-full">
          <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
          {textSection("1. Acceptance of Terms", "By accessing or using Elite Veo, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our service.")}
          {textSection("2. Use of Service", "Elite Veo provides AI-assisted tools. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others.")}
          {textSection("3. User Content", "You retain ownership of any content you create using our platform. By using the service, you grant Elite Veo a limited license to process your inputs solely for the purpose of generating your requested output.")}
          {textSection("4. Intellectual Property", "All trademarks, logos, and service names displayed in the app are the property of Elite Veo or their respective owners. Unauthorized use is strictly prohibited.")}
          {textSection("5. Disclaimer of Warranties", "The service is provided on an 'as is' and 'as available' basis without warranties of any kind. We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content.")}
          {textSection("6. Limitation of Liability", "Elite Veo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.")}
          {textSection("7. Changes to Terms", "We reserve the right to modify these terms at any time. Your continued use of the service after changes constitutes your acceptance of the revised terms.")}
          {textSection("8. Contact", "If you have questions about these Terms & Conditions, please contact us through the app's support channel.")}
        </div>
      </SubPage>
    );
  }

  if (view === "privacy") {
    return (
      <SubPage title="Privacy Policy" onBack={back}>
        <div className="px-5 py-6 max-w-2xl mx-auto w-full">
          <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
          {textSection("1. Information We Collect", "We collect information you provide when you create an account (name and email address) and the prompts you submit. We do not collect payment information.")}
          {textSection("2. How We Use Your Information", "We use the information we collect to provide, maintain, and improve the service, to personalize your experience, and to communicate with you about updates.")}
          {textSection("3. Data Storage", "Your account information and conversation history are stored securely via Supabase. We protect your data with industry-standard security measures.")}
          {textSection("4. Cookies and Tracking", "We do not use third-party tracking technologies. Your preferences are stored in your browser's local storage.")}
          {textSection("5. Data Sharing", "We do not sell, trade, or otherwise transfer your personal information to third parties.")}
          {textSection("6. Children's Privacy", "Our service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13.")}
          {textSection("7. Your Rights", "You may access, update, or delete your account information at any time through the Settings page.")}
          {textSection("8. Changes to This Policy", "We may update this Privacy Policy from time to time. Your continued use of the service after changes are posted constitutes acceptance.")}
          {textSection("9. Contact Us", "If you have questions about this Privacy Policy, please reach out through the app's support channel.")}
        </div>
      </SubPage>
    );
  }

  if (view === "about") {
    return (
      <SubPage title="About" onBack={back}>
        <div className="px-4 pt-6 space-y-4">
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
              EV
            </div>
            <p className="text-base font-semibold text-foreground">Elite Veo</p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
            <div className="px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Built with</p>
              <p className="text-sm text-foreground mt-0.5">React · Supabase · Groq · Gemini</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-xs text-muted-foreground">AI Providers</p>
              <p className="text-sm text-foreground mt-0.5">Groq (primary) · Gemini (fallback)</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Image Generation</p>
              <p className="text-sm text-foreground mt-0.5">Freepik Mystic · Gemini Vision</p>
            </div>
          </div>
        </div>
      </SubPage>
    );
  }

  /* ── Main settings view ── */
  return (
    <div className="h-dvh bg-background flex flex-col">
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
                onClick={() => setView("profile")}
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
            onClick={() => setView("personalization")}
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
            onClick={() => setView("password")}
          />
        </SectionCard>

        {/* General */}
        <SectionCard label="General">
          <Row
            icon={Trash2}
            label="Data Controls"
            sublabel="Delete all chat history"
            onClick={() => setView("data")}
          />
          <Row
            icon={FileText}
            label="Terms of Service"
            onClick={() => setView("terms")}
          />
          <Row
            icon={Shield}
            label="Privacy Policy"
            onClick={() => setView("privacy")}
          />
          <Row
            icon={Info}
            label="About"
            sublabel="Elite Veo v1.0.0"
            onClick={() => setView("about")}
          />
        </SectionCard>

        {/* Log out */}
        <div className="px-4 mb-3">
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <Row icon={LogOut} label="Log out" onClick={handleSignOut} danger noArrow />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Edit Profile sub-page ── */
const ProfileView = ({ onBack }: { onBack: () => void }) => {
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
    onBack();
  };

  return (
    <SubPage title="Edit Profile" onBack={onBack}>
      <div className="px-4 pt-6 space-y-5 max-w-md mx-auto w-full">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-muted-foreground uppercase tracking-wider">
            Display name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
          <Input value={user?.email ?? ""} disabled className="rounded-xl opacity-50" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full rounded-xl">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save changes
        </Button>
      </div>
    </SubPage>
  );
};

/* ── Change Password sub-page ── */
const PasswordView = ({ onBack }: { onBack: () => void }) => {
  const { user, resetPassword, verifyRecoveryOtp, updatePassword } = useAuth();
  const [stage, setStage] = useState<"intro" | "otp" | "new">("intro");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const sendOtp = async () => {
    if (!user?.email) return toast.error("No email on this account");
    setLoading(true);
    const { error } = await resetPassword(user.email);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Verification code sent to your email");
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
    toast.success("Password updated successfully");
    onBack();
  };

  return (
    <SubPage title="Change Password" onBack={onBack}>
      <div className="px-4 pt-6 max-w-md mx-auto w-full">
        {stage === "intro" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <KeyRound className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Verify your email</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                We'll send a verification code to your email address to confirm your identity before changing your password.
              </p>
              <Button onClick={sendOtp} disabled={loading} className="w-full rounded-xl">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send verification code
              </Button>
            </div>
          </div>
        )}

        {stage === "otp" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <ShieldCheck className="h-4 w-4 text-foreground/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Enter verification code</p>
                  <p className="text-xs text-muted-foreground">Sent to {user?.email}</p>
                </div>
              </div>
              <OtpInput length={8} onComplete={verifyOtp} disabled={loading} error={!!otpError} />
              {otpError && <p className="text-xs text-destructive mt-3 text-center">{otpError}</p>}
              {loading && <p className="text-xs text-muted-foreground mt-3 text-center">Verifying…</p>}
              <button
                onClick={sendOtp}
                disabled={loading}
                className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {stage === "new" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
              <p className="text-sm font-medium text-foreground">Set your new password</p>
              <div className="space-y-1.5">
                <Label htmlFor="pw" className="text-xs text-muted-foreground">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2" className="text-xs text-muted-foreground">Confirm password</Label>
                <Input
                  id="pw2"
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && saveNewPassword()}
                />
              </div>
              <Button onClick={saveNewPassword} disabled={loading} className="w-full rounded-xl">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update password
              </Button>
            </div>
          </div>
        )}
      </div>
    </SubPage>
  );
};

/* ── Delete All Chats button ── */
const DeleteAllChatsButton = ({
  conversations,
  deleteConversation,
  onDone,
}: {
  conversations: any[];
  deleteConversation: (id: string) => Promise<void>;
  onDone: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handle = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    for (const conv of conversations) await deleteConversation(conv.id);
    setLoading(false);
    toast.success("All chats deleted");
    onDone();
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={[
        "w-full rounded-xl py-3 text-sm font-semibold transition-colors",
        confirmed
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-secondary text-foreground hover:bg-secondary/70",
      ].join(" ")}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
        </span>
      ) : confirmed ? (
        "Tap again to confirm delete"
      ) : (
        "Delete all chats"
      )}
    </button>
  );
};

export default Settings;
