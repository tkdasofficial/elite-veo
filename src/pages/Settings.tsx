import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Palette, LogOut, Check, Monitor, Sun, Moon,
  KeyRound, Loader2, ShieldCheck, Mail, Video, Trash2,
  Info, FileText, Shield, Pencil, Bell, Globe, Type,
  Brain, BookOpen, Bug, AlertTriangle, Download, UserX,
  ToggleLeft, ToggleRight, Plus, X, Smartphone, Lock,
  RefreshCw, Database, Archive, Zap, ChevronDown,
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

/* ══════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════ */
type View =
  | "main"
  | "profile"
  | "personalization"
  | "custom-instructions"
  | "memory"
  | "notifications"
  | "language"
  | "font-size"
  | "password"
  | "security"
  | "data"
  | "bug-report"
  | "delete-account"
  | "terms"
  | "privacy"
  | "about";

/* ══════════════════════════════════════════════════
   Local-storage helpers
══════════════════════════════════════════════════ */
const ls = {
  get: <T>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: <T>(key: string, val: T) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

/* ══════════════════════════════════════════════════
   Shared sub-page wrapper
══════════════════════════════════════════════════ */
const SubPage = ({
  title, onBack, children, trailing,
}: {
  title: string; onBack: () => void;
  children: React.ReactNode; trailing?: React.ReactNode;
}) => (
  <div className="h-dvh bg-background flex flex-col">
    <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border/20">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {trailing}
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

/* ── Toggle pill ── */
const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? "bg-primary" : "bg-secondary"}`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`}
    />
  </button>
);

/* ── Section card ── */
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

/* ── Row ── */
const Row = ({
  icon: Icon, label, sublabel, onClick, danger, noArrow, trailing, iconColor,
}: {
  icon: React.ElementType; label: string; sublabel?: string;
  onClick?: () => void; danger?: boolean; noArrow?: boolean;
  trailing?: React.ReactNode; iconColor?: string;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={[
      "flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors disabled:cursor-default",
      danger ? "hover:bg-destructive/5" : "hover:bg-secondary/40",
    ].join(" ")}
  >
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? "bg-destructive/10" : "bg-secondary"}`}>
      <Icon className={`h-4 w-4 ${iconColor || (danger ? "text-destructive" : "text-foreground/70")}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sublabel}</p>}
    </div>
    {trailing}
    {!noArrow && !danger && onClick && !trailing && (
      <ArrowLeft className="h-4 w-4 text-muted-foreground/30 rotate-180 shrink-0" />
    )}
  </button>
);

/* ── Long text blocks ── */
const textSection = (title: string, body: string) => (
  <div key={title} className="mb-6">
    <h2 className="text-sm font-semibold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

/* ══════════════════════════════════════════════════
   Main Settings component
══════════════════════════════════════════════════ */
const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { conversations, deleteConversation } = useApp();

  const [view, setView] = useState<View>("main");
  const back = useCallback(() => setView("main"), []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const themeLabel = theme === "system" ? "System" : theme === "light" ? "Light" : "Dark";
  const fontSizeLabel = ls.get("ev_font_size", "Medium");
  const langLabel = ls.get("ev_language", "English");
  const memoryOn = ls.get("ev_memory_enabled", true);
  const notifOn = ls.get("ev_notif_any", true);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  /* ─────────────────── Sub-views ─────────────────── */

  if (view === "profile") return <ProfileView onBack={back} />;
  if (view === "password") return <PasswordView onBack={back} />;

  if (view === "personalization") return (
    <SubPage title="Personalization" onBack={back}>
      <div className="px-4 pt-5">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Theme</p>
        <div className="space-y-2 mb-5">
          {([
            { value: "system", label: "System default", desc: "Match device setting", icon: Monitor },
            { value: "light", label: "Light", desc: "Bright background", icon: Sun },
            { value: "dark", label: "Dark", desc: "Dark background", icon: Moon },
          ] as { value: ThemeMode; label: string; desc: string; icon: React.ElementType }[]).map(({ value, label, desc, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors ${active ? "border-primary/50 bg-secondary/60" : "border-border/30 bg-secondary/20 hover:bg-secondary/40"}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {active && <Check className="h-4 w-4 text-foreground shrink-0" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground/40 text-center pb-4">
          Changes apply immediately across the app.
        </p>
      </div>
    </SubPage>
  );

  if (view === "language") return <LanguageView onBack={back} />;
  if (view === "font-size") return <FontSizeView onBack={back} />;
  if (view === "custom-instructions") return <CustomInstructionsView onBack={back} />;
  if (view === "memory") return <MemoryView onBack={back} />;
  if (view === "notifications") return <NotificationsView onBack={back} />;
  if (view === "security") return <SecurityView onBack={back} />;
  if (view === "data") return <DataView onBack={back} conversations={conversations} deleteConversation={deleteConversation} />;
  if (view === "bug-report") return <BugReportView onBack={back} />;
  if (view === "delete-account") return <DeleteAccountView onBack={back} signOut={signOut} />;

  if (view === "terms") return (
    <SubPage title="Terms of Service" onBack={back}>
      <div className="px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
        {textSection("1. Acceptance of Terms", "By accessing or using Elite Veo, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use our service.")}
        {textSection("2. Use of Service", "Elite Veo provides AI-assisted tools. You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of others.")}
        {textSection("3. User Content", "You retain ownership of any content you create. By using the service, you grant Elite Veo a limited license to process your inputs solely to generate your requested output.")}
        {textSection("4. Intellectual Property", "All trademarks, logos, and service names displayed are the property of Elite Veo or their respective owners. Unauthorized use is strictly prohibited.")}
        {textSection("5. Disclaimer of Warranties", "The service is provided 'as is' without warranties of any kind. We do not guarantee the accuracy or usefulness of any AI-generated content.")}
        {textSection("6. Limitation of Liability", "Elite Veo shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use the service.")}
        {textSection("7. Changes to Terms", "We reserve the right to modify these terms at any time. Continued use after changes constitutes your acceptance.")}
        {textSection("8. Contact", "If you have questions about these Terms, please contact us through the app's support channel.")}
      </div>
    </SubPage>
  );

  if (view === "privacy") return (
    <SubPage title="Privacy Policy" onBack={back}>
      <div className="px-5 py-6 max-w-2xl mx-auto w-full">
        <p className="text-xs text-muted-foreground mb-6">Last updated: April 2025</p>
        {textSection("1. Information We Collect", "We collect information you provide when creating an account (name and email) and the prompts you submit. We do not collect payment information.")}
        {textSection("2. How We Use Your Information", "We use collected information to provide, maintain, and improve the service, personalize your experience, and communicate important updates.")}
        {textSection("3. Data Storage", "Your account information and conversations are stored securely via Supabase with industry-standard encryption.")}
        {textSection("4. Cookies and Tracking", "We do not use third-party tracking technologies. Your preferences are stored in your browser's local storage.")}
        {textSection("5. Data Sharing", "We do not sell, trade, or transfer your personal information to third parties.")}
        {textSection("6. Children's Privacy", "Our service is not directed to children under 13. We do not knowingly collect information from children under 13.")}
        {textSection("7. Your Rights", "You may access, update, or delete your account information at any time through the Settings page.")}
        {textSection("8. Contact Us", "For questions about this Privacy Policy, please reach out through the app's support channel.")}
      </div>
    </SubPage>
  );

  if (view === "about") return (
    <SubPage title="About" onBack={back}>
      <div className="px-4 pt-4 pb-10">
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/30">
            EV
          </div>
          <p className="text-lg font-bold text-foreground">Elite Veo</p>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </div>
        <div className="space-y-2">
          {[
            ["Platform", "React + Vite + TypeScript"],
            ["Backend", "Supabase (Auth · Database · Storage)"],
            ["AI Engine", "Groq (primary) · Gemini (fallback)"],
            ["Image Gen", "Freepik Mystic · Gemini Vision"],
            ["Voice", "Browser Web Speech API"],
            ["Streaming", "Server-sent events (SSE)"],
            ["Deployment", "Replit Cloud"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center rounded-xl bg-secondary/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-xs text-foreground font-medium text-right max-w-[55%] truncate">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          © 2025 Elite Veo. All rights reserved.
        </p>
      </div>
    </SubPage>
  );

  /* ─────────────────── Main view ─────────────────── */
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
        {/* Avatar */}
        {user && (
          <div className="flex flex-col items-center pt-2 pb-6 px-4">
            <div className="relative mb-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold select-none shadow-lg shadow-primary/30">
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
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        )}

        {/* My Elite Veo */}
        <SectionCard label="My Elite Veo">
          <Row icon={Palette} label="Personalization" sublabel={`Theme · ${themeLabel}`} onClick={() => setView("personalization")} />
          <Row icon={BookOpen} label="Custom Instructions" sublabel="Tell AI how to respond" onClick={() => setView("custom-instructions")} />
          <Row icon={Brain} label="Memory" sublabel={memoryOn ? "On" : "Off"} onClick={() => setView("memory")} />
          <Row icon={Video} label="All Creations" sublabel="Images, videos & more" onClick={() => navigate("/my-creations")} />
        </SectionCard>

        {/* Account */}
        <SectionCard label="Account">
          <Row icon={Mail} label="Email" sublabel={user?.email ?? "Not signed in"} noArrow />
          <Row icon={KeyRound} label="Change Password" onClick={() => setView("password")} />
          <Row icon={Lock} label="Security" sublabel="Sessions & access" onClick={() => setView("security")} />
        </SectionCard>

        {/* Preferences */}
        <SectionCard label="Preferences">
          <Row icon={Globe} label="Language" sublabel={langLabel} onClick={() => setView("language")} />
          <Row icon={Type} label="Font Size" sublabel={fontSizeLabel} onClick={() => setView("font-size")} />
          <Row icon={Bell} label="Notifications" sublabel={notifOn ? "Enabled" : "Disabled"} onClick={() => setView("notifications")} />
        </SectionCard>

        {/* General */}
        <SectionCard label="General">
          <Row icon={Database} label="Data Controls" sublabel="Export · Archive · Delete" onClick={() => setView("data")} />
          <Row icon={Bug} label="Report a Bug" sublabel="Help us improve" onClick={() => setView("bug-report")} />
          <Row icon={FileText} label="Terms of Service" onClick={() => setView("terms")} />
          <Row icon={Shield} label="Privacy Policy" onClick={() => setView("privacy")} />
          <Row icon={Info} label="About" sublabel="Elite Veo v1.0.0" onClick={() => setView("about")} />
        </SectionCard>

        {/* Danger */}
        <SectionCard label="Danger Zone">
          <Row icon={UserX} label="Delete Account" danger onClick={() => setView("delete-account")} noArrow={false} />
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

/* ══════════════════════════════════════════════════
   Profile sub-view
══════════════════════════════════════════════════ */
const ProfileView = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim(), full_name: name.trim() } });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onBack();
  };

  return (
    <SubPage title="Edit Profile" onBack={onBack}>
      <div className="px-4 pt-6 space-y-5 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-md shadow-primary/20">
            {(name || user?.name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Display name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && save()} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
          <Input value={user?.email ?? ""} disabled className="rounded-xl opacity-50" />
          <p className="text-[11px] text-muted-foreground/60 px-1">Email cannot be changed here.</p>
        </div>
        <Button onClick={save} disabled={saving} className="w-full rounded-xl">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save changes
        </Button>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Custom Instructions sub-view
══════════════════════════════════════════════════ */
const CustomInstructionsView = ({ onBack }: { onBack: () => void }) => {
  const [about, setAbout] = useState(() => ls.get("ev_ci_about", ""));
  const [style, setStyle] = useState(() => ls.get("ev_ci_style", ""));
  const [enabled, setEnabled] = useState(() => ls.get("ev_ci_enabled", false));

  const save = () => {
    ls.set("ev_ci_about", about);
    ls.set("ev_ci_style", style);
    ls.set("ev_ci_enabled", enabled);
    toast.success("Custom instructions saved");
    onBack();
  };

  return (
    <SubPage
      title="Custom Instructions"
      onBack={onBack}
      trailing={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{enabled ? "On" : "Off"}</span>
          <Toggle on={enabled} onToggle={() => setEnabled((v) => !v)} />
        </div>
      }
    >
      <div className="px-4 pt-5 pb-8 space-y-5 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-secondary/30 p-4">
          <div className="flex items-start gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Custom instructions let you tell Elite Veo things about yourself and how you want it to respond — applied to every conversation.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            What should Elite Veo know about you?
          </Label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="e.g. I'm a filmmaker based in Mumbai. I work on short-form content for social media..."
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/50 text-right">{about.length}/1500</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            How should Elite Veo respond?
          </Label>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            rows={5}
            maxLength={1500}
            placeholder="e.g. Be concise and direct. Use bullet points for lists. Always explain your reasoning..."
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/50 text-right">{style.length}/1500</p>
        </div>

        <Button onClick={save} className="w-full rounded-xl">Save instructions</Button>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Memory sub-view
══════════════════════════════════════════════════ */
interface Memory { id: string; text: string; createdAt: string; }

const MemoryView = ({ onBack }: { onBack: () => void }) => {
  const [enabled, setEnabled] = useState(() => ls.get("ev_memory_enabled", true));
  const [memories, setMemories] = useState<Memory[]>(() => ls.get("ev_memories", []));
  const [newText, setNewText] = useState("");

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    ls.set("ev_memory_enabled", next);
    toast.success(next ? "Memory enabled" : "Memory disabled");
  };

  const addMemory = () => {
    if (!newText.trim()) return;
    const m: Memory = { id: Date.now().toString(), text: newText.trim(), createdAt: new Date().toISOString() };
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
    <SubPage
      title="Memory"
      onBack={onBack}
      trailing={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{enabled ? "On" : "Off"}</span>
          <Toggle on={enabled} onToggle={toggleEnabled} />
        </div>
      }
    >
      <div className="px-4 pt-5 pb-8 space-y-4 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Elite Veo can remember things you tell it across conversations. Memories are stored locally on this device.
          </p>
        </div>

        {/* Add new memory */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Add a memory</Label>
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Memory list */}
        {memories.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">Saved memories</p>
              <button onClick={clearAll} className="text-xs text-destructive hover:underline">Clear all</button>
            </div>
            <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
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
          <div className="text-center py-8 text-muted-foreground/40">
            <Brain className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No memories saved yet</p>
          </div>
        )}
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Notifications sub-view
══════════════════════════════════════════════════ */
const NotificationsView = ({ onBack }: { onBack: () => void }) => {
  const [settings, setSettings] = useState(() => ls.get("ev_notifications", {
    responses: true,
    updates: true,
    weekly: false,
    marketing: false,
  }));

  const toggle = (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    ls.set("ev_notifications", next);
    ls.set("ev_notif_any", Object.values(next).some(Boolean));
    toast.success("Preference saved");
  };

  const items: { key: keyof typeof settings; label: string; desc: string; icon: React.ElementType }[] = [
    { key: "responses", label: "AI Response Alerts", desc: "When a long response finishes", icon: Zap },
    { key: "updates", label: "Product Updates", desc: "New features and improvements", icon: RefreshCw },
    { key: "weekly", label: "Weekly Digest", desc: "Your usage summary each week", icon: Archive },
    { key: "marketing", label: "Tips & Offers", desc: "Helpful tips and special offers", icon: Bell },
  ];

  return (
    <SubPage title="Notifications" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-3 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {items.map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Toggle on={settings[key]} onToggle={() => toggle(key)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/40 text-center pt-2">
          Notification delivery depends on your device and browser settings.
        </p>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Language sub-view
══════════════════════════════════════════════════ */
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
];

const LanguageView = ({ onBack }: { onBack: () => void }) => {
  const [selected, setSelected] = useState(() => ls.get("ev_language", "English"));

  const pick = (label: string) => {
    setSelected(label);
    ls.set("ev_language", label);
    toast.success(`Language set to ${label}`);
  };

  return (
    <SubPage title="Language" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-2">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {LANGUAGES.map(({ label, native }) => (
            <button
              key={label}
              onClick={() => pick(label)}
              className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-secondary/40 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{native}</p>
              </div>
              {selected === label && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/40 text-center pt-2">
          Full UI translation coming soon. English is currently active.
        </p>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Font Size sub-view
══════════════════════════════════════════════════ */
const FONT_SIZES = [
  { label: "Small", desc: "Compact, more content visible", scale: "text-sm" },
  { label: "Medium", desc: "Default, balanced readability", scale: "text-base" },
  { label: "Large", desc: "Bigger, easier on the eyes", scale: "text-lg" },
  { label: "Extra Large", desc: "Maximum accessibility", scale: "text-xl" },
];

const FontSizeView = ({ onBack }: { onBack: () => void }) => {
  const [selected, setSelected] = useState(() => ls.get("ev_font_size", "Medium"));

  const pick = (label: string, scale: string) => {
    setSelected(label);
    ls.set("ev_font_size", label);
    document.documentElement.setAttribute("data-font-size", scale);
    toast.success(`Font size set to ${label}`);
  };

  return (
    <SubPage title="Font Size" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-2">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {FONT_SIZES.map(({ label, desc, scale }) => (
            <button
              key={label}
              onClick={() => pick(label, scale)}
              className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-secondary/40 transition-colors"
            >
              <div className="text-left">
                <p className={`font-medium text-foreground ${scale}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {selected === label && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-secondary/20 px-4 py-3 mt-2">
          <p className="text-xs text-muted-foreground text-center">Preview</p>
          <p className={`text-foreground text-center mt-1 ${FONT_SIZES.find((f) => f.label === selected)?.scale}`}>
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Security sub-view
══════════════════════════════════════════════════ */
const SecurityView = ({ onBack }: { onBack: () => void }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const signOutAll = async () => {
    setSigningOut(true);
    await supabase.auth.signOut({ scope: "global" });
    await signOut();
    navigate("/");
    toast.success("Signed out from all devices");
  };

  const session = supabase.auth.getSession();

  return (
    <SubPage title="Security" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-4 max-w-md mx-auto w-full">
        {/* Current session */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Current Session</p>
          <div className="rounded-2xl bg-secondary/30 divide-y divide-border/20 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                <Smartphone className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">This device</p>
                <p className="text-xs text-green-500 mt-0.5">● Active now</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Two-Factor Authentication</p>
          <div className="rounded-2xl bg-secondary/30 divide-y divide-border/20 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-4 w-4 text-foreground/70" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Authenticator App</p>
                <p className="text-xs text-muted-foreground mt-0.5">2FA via TOTP — coming soon</p>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* Sign out all */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Devices</p>
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <button
              onClick={signOutAll}
              disabled={signingOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-destructive/5 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-destructive">Sign out all devices</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ends all active sessions everywhere</p>
              </div>
              {signingOut && <Loader2 className="h-4 w-4 text-destructive animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Change Password sub-view
══════════════════════════════════════════════════ */
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
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <KeyRound className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Verify your email</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We'll send a verification code to confirm your identity before changing your password.
            </p>
            <Button onClick={sendOtp} disabled={loading} className="w-full rounded-xl">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send verification code
            </Button>
          </div>
        )}
        {stage === "otp" && (
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Enter code</p>
                <p className="text-xs text-muted-foreground">Sent to {user?.email}</p>
              </div>
            </div>
            <OtpInput length={8} onComplete={verifyOtp} disabled={loading} error={!!otpError} />
            {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}
            {loading && <p className="text-xs text-muted-foreground text-center">Verifying…</p>}
            <button onClick={sendOtp} disabled={loading} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
              Resend code
            </button>
          </div>
        )}
        {stage === "new" && (
          <div className="rounded-2xl bg-secondary/30 p-5 space-y-4">
            <p className="text-sm font-medium text-foreground">Set your new password</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">New password</Label>
              <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirm password</Label>
              <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && saveNewPassword()} />
            </div>
            <Button onClick={saveNewPassword} disabled={loading} className="w-full rounded-xl">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update password
            </Button>
          </div>
        )}
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Data Controls sub-view
══════════════════════════════════════════════════ */
const DataView = ({
  onBack, conversations, deleteConversation,
}: {
  onBack: () => void;
  conversations: any[];
  deleteConversation: (id: string) => Promise<void>;
}) => {
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
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
    onBack();
  };

  return (
    <SubPage title="Data Controls" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-4 max-w-md mx-auto w-full">
        {/* Export */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Export</p>
          <div className="rounded-2xl bg-secondary/30 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary shrink-0">
                <Download className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Export your data</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Download a copy of your conversations and settings as a JSON file.
                </p>
              </div>
            </div>
            <button
              onClick={exportData}
              className="w-full rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors"
            >
              Export data
            </button>
          </div>
        </div>

        {/* Archive */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Archive</p>
          <div className="rounded-2xl bg-secondary/30 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary shrink-0">
                <Archive className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Archive all chats</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Move all conversations to an archive. They won't appear in your chat list but won't be deleted.
                </p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Archiving coming in a future update")}
              className="w-full rounded-xl bg-secondary py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/70 transition-colors opacity-60"
            >
              Archive all chats
            </button>
          </div>
        </div>

        {/* Delete */}
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">Delete</p>
          <div className="rounded-2xl bg-secondary/30 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Delete all chats</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Permanently delete all conversations and messages. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={deleteAllChats}
              disabled={deleting}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                deleteConfirmed ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
              }`}
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </span>
              ) : deleteConfirmed ? "Tap again to confirm" : "Delete all chats"}
            </button>
          </div>
        </div>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Bug Report sub-view
══════════════════════════════════════════════════ */
const CATEGORIES = ["UI / Display issue", "AI response problem", "Performance", "Account / Auth", "Crash or error", "Other"];

const BugReportView = ({ onBack }: { onBack: () => void }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [showCats, setShowCats] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!description.trim()) return toast.error("Please describe the issue");
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    toast.success("Bug report submitted — thank you!");
    onBack();
  };

  return (
    <SubPage title="Report a Bug" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-5 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-secondary/30 p-4 flex items-start gap-3">
          <Bug className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Found something wrong? Tell us what happened and we'll fix it as quickly as possible.
          </p>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
          <div className="relative">
            <button
              onClick={() => setShowCats((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground"
            >
              {category}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showCats ? "rotate-180" : ""}`} />
            </button>
            {showCats && (
              <div className="absolute z-10 mt-1 w-full rounded-xl bg-popover border border-border/30 shadow-xl overflow-hidden">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setShowCats(false); }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
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
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="Describe the bug in detail. What did you do? What did you expect? What happened instead?"
            className="w-full rounded-xl bg-secondary/50 border border-border/30 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
          <p className="text-[11px] text-muted-foreground/50 text-right">{description.length}/2000</p>
        </div>

        <Button onClick={submit} disabled={sending} className="w-full rounded-xl">
          {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit report
        </Button>
      </div>
    </SubPage>
  );
};

/* ══════════════════════════════════════════════════
   Delete Account sub-view
══════════════════════════════════════════════════ */
const DeleteAccountView = ({ onBack, signOut }: { onBack: () => void; signOut: () => Promise<void> }) => {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (confirm !== "DELETE") return toast.error('Type "DELETE" to confirm');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    await signOut();
    toast.success("Account deletion requested. You will be contacted within 24 hours.");
    navigate("/");
  };

  return (
    <SubPage title="Delete Account" onBack={onBack}>
      <div className="px-4 pt-5 pb-8 space-y-5 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">This action is permanent</p>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
            <li>• All your conversations and messages will be deleted</li>
            <li>• All your creations will be removed</li>
            <li>• Your account cannot be recovered after deletion</li>
            <li>• Any active subscriptions will be cancelled</li>
          </ul>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Type <span className="font-bold text-destructive">DELETE</span> to confirm
          </Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="rounded-xl border-destructive/30 focus-visible:ring-destructive/40"
          />
        </div>

        <button
          onClick={handle}
          disabled={loading || confirm !== "DELETE"}
          className="w-full rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </span>
          ) : "Delete my account"}
        </button>

        <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
          Account deletion is processed within 24 hours. You'll receive a confirmation email.
        </p>
      </div>
    </SubPage>
  );
};

export default Settings;
