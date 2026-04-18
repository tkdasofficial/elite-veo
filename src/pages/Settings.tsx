import { useNavigate } from "react-router-dom";
import {
  Palette, LogOut, BookOpen, Brain, Video, Mail, KeyRound,
  Lock, Globe, Type, Bell, Database, Bug, FileText,
  Shield, Info, UserX, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ls, SectionCard, SettingsRow } from "@/components/settings/shared";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const themeLabel   = theme === "system" ? "System" : theme === "light" ? "Light" : "Dark";
  const fontLabel    = ls.get("ev_font_size", "Medium");
  const langLabel    = ls.get("ev_language", "English");
  const memoryOn     = ls.get("ev_memory_enabled", true);
  const notifOn      = ls.get("ev_notif_any", true);
  const ciEnabled    = ls.get("ev_ci_enabled", false);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center px-4 h-14 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">

        {/* ── Profile hero ── */}
        <button
          onClick={() => navigate("/settings/profile")}
          className="flex w-full items-center gap-4 px-5 pt-2 pb-6 hover:bg-secondary/20 active:bg-secondary/40 transition-colors"
        >
          {/* Avatar — no pencil/upload icon */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-md shadow-primary/20 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-base font-bold text-foreground truncate">{user?.name ?? "Guest"}</p>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
            )}
            <p className="text-xs text-primary mt-1 font-medium">Edit name & username →</p>
          </div>
        </button>

        {/* ── My Elite Veo ── */}
        <SectionCard label="My Elite Veo">
          <SettingsRow icon={Palette}   label="Personalization"      sublabel={`Theme · ${themeLabel}`}               onClick={() => navigate("/settings/personalization")} />
          <SettingsRow icon={BookOpen}  label="Custom Instructions"  sublabel={ciEnabled ? "Enabled" : "Disabled"}    onClick={() => navigate("/settings/custom-instructions")} />
          <SettingsRow icon={Brain}     label="Memory"               sublabel={memoryOn ? "On" : "Off"}               onClick={() => navigate("/settings/memory")} />
          <SettingsRow icon={Video}     label="All Creations"        sublabel="Images, videos & more"                  onClick={() => navigate("/my-creations")} />
        </SectionCard>

        {/* ── Account ── */}
        <SectionCard label="Account">
          <SettingsRow icon={Mail}      label="Email"                sublabel={user?.email ?? "Not signed in"}  noArrow />
          <SettingsRow icon={KeyRound}  label="Change Password"      onClick={() => navigate("/settings/password")} />
          <SettingsRow icon={Lock}      label="Security"             sublabel="Sessions & access"                onClick={() => navigate("/settings/security")} />
        </SectionCard>

        {/* ── Preferences ── */}
        <SectionCard label="Preferences">
          <SettingsRow icon={Globe}     label="Language"             sublabel={langLabel}                        onClick={() => navigate("/settings/language")} />
          <SettingsRow icon={Type}      label="Font Size"            sublabel={fontLabel}                        onClick={() => navigate("/settings/font-size")} />
          <SettingsRow icon={Bell}      label="Notifications"        sublabel={notifOn ? "Enabled" : "Disabled"} onClick={() => navigate("/settings/notifications")} />
        </SectionCard>

        {/* ── General ── */}
        <SectionCard label="General">
          <SettingsRow icon={Database}  label="Data Controls"        sublabel="Export · Archive · Delete"        onClick={() => navigate("/settings/data")} />
          <SettingsRow icon={Bug}       label="Report a Bug"         sublabel="Help us improve"                  onClick={() => navigate("/settings/bug-report")} />
          <SettingsRow icon={FileText}  label="Terms of Service"     onClick={() => navigate("/settings/terms")} />
          <SettingsRow icon={Shield}    label="Privacy Policy"       onClick={() => navigate("/settings/privacy")} />
          <SettingsRow icon={Info}      label="About"                sublabel="Elite Veo v1.0.0"                 onClick={() => navigate("/settings/about")} />
        </SectionCard>

        {/* ── Danger Zone ── */}
        <SectionCard label="Danger Zone">
          <SettingsRow icon={UserX}     label="Delete Account"       danger onClick={() => navigate("/settings/delete-account")} />
        </SectionCard>

        {/* ── Log out ── */}
        <div className="px-4 mb-3">
          <div className="rounded-2xl bg-secondary/30 overflow-hidden">
            <SettingsRow
              icon={LogOut}
              label="Log out"
              danger
              noArrow
              onClick={handleSignOut}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
