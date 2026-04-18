import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, RefreshCw, Archive, Bell, Mail } from "lucide-react";
import { SettingsPage, Toggle, ls } from "@/components/settings/shared";
import { toast } from "sonner";

interface NotifSettings {
  responses: boolean;
  updates: boolean;
  weekly: boolean;
  marketing: boolean;
  email: boolean;
}

const ITEMS: {
  key: keyof NotifSettings;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { key: "responses",  label: "AI Response Alerts",  desc: "When a long response finishes",          icon: Zap      },
  { key: "updates",    label: "Product Updates",      desc: "New features and improvements",           icon: RefreshCw },
  { key: "weekly",     label: "Weekly Digest",        desc: "A summary of your usage each week",       icon: Archive  },
  { key: "marketing",  label: "Tips & Offers",        desc: "Helpful tips and special offers",         icon: Bell     },
  { key: "email",      label: "Email Notifications",  desc: "Receive important updates by email",      icon: Mail     },
];

const DEFAULT: NotifSettings = {
  responses: true, updates: true, weekly: false, marketing: false, email: true,
};

const Notifications = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotifSettings>(() =>
    ls.get("ev_notifications", DEFAULT)
  );

  const toggle = (key: keyof NotifSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    ls.set("ev_notifications", next);
    ls.set("ev_notif_any", Object.values(next).some(Boolean));
    toast.success("Preference saved");
  };

  return (
    <SettingsPage title="Notifications" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 max-w-md mx-auto w-full">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {ITEMS.map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-center gap-4 px-4 py-4">
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
        <p className="text-xs text-muted-foreground/40 text-center mt-5 leading-relaxed">
          Notification delivery depends on your device and browser permissions.
        </p>
      </div>
    </SettingsPage>
  );
};

export default Notifications;
