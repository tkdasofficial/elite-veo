import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Bell, Shield, Palette, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SettingsRow = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={[
      "flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors text-left",
      danger
        ? "text-destructive hover:bg-destructive/5"
        : "text-foreground hover:bg-secondary/50",
    ].join(" ")}
  >
    <div className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full", danger ? "bg-destructive/10" : "bg-secondary"].join(" ")}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium">{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">

      {/* Header */}
      <div className="relative flex items-center px-4 py-3 border-b border-border/20 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <h1 className="absolute inset-x-14 text-center text-sm font-semibold text-foreground pointer-events-none">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* Profile card */}
        {user && (
          <div className="mx-4 mt-5 mb-2 rounded-2xl border border-border bg-card/50 p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-base font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Account section */}
        <div className="mx-4 mt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 px-1">Account</p>
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
            <SettingsRow icon={User} label="Edit Profile" sublabel="Name, email" />
            <SettingsRow icon={Bell} label="Notifications" sublabel="Push, email preferences" />
          </div>
        </div>

        {/* App section */}
        <div className="mx-4 mt-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 px-1">App</p>
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
            <SettingsRow icon={Palette} label="Appearance" sublabel="Follows your system theme" />
            <SettingsRow icon={Shield} label="Privacy Policy" onClick={() => navigate("/privacy")} />
            <SettingsRow
              icon={Shield}
              label="Terms & Conditions"
              onClick={() => navigate("/terms")}
            />
          </div>
        </div>

        {/* Danger zone */}
        <div className="mx-4 mt-4">
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
            <SettingsRow icon={Trash2} label="Sign Out" onClick={handleSignOut} danger />
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-6">Elite Veo v1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
