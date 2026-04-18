import { useNavigate } from "react-router-dom";
import { Check, Monitor, Sun, Moon } from "lucide-react";
import { SettingsPage } from "@/components/settings/shared";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

const THEMES: { value: ThemeMode; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "system", label: "System default", desc: "Match your device setting", icon: Monitor },
  { value: "light",  label: "Light",          desc: "Bright, clean background",  icon: Sun },
  { value: "dark",   label: "Dark",           desc: "Easy on the eyes at night",  icon: Moon },
];

const Personalization = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <SettingsPage title="Personalization" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-6 pb-10 max-w-md mx-auto w-full">
        <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3 px-1">
          Theme
        </p>
        <div className="space-y-2">
          {THEMES.map(({ value, label, desc, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={[
                  "flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all active:scale-[0.98]",
                  active
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/30 bg-secondary/20 hover:bg-secondary/40",
                ].join(" ")}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    active ? "bg-primary/10" : "bg-secondary"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${active ? "text-primary" : "text-foreground/60"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    active ? "border-primary bg-primary" : "border-border/40"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground/40 text-center mt-6">
          Theme changes apply instantly across the entire app.
        </p>
      </div>
    </SettingsPage>
  );
};

export default Personalization;
