import { X, Cloud, BarChart3, Music } from "lucide-react";
import { SiGithub, SiYoutube, SiTiktok, SiInstagram, SiSpotify } from "react-icons/si";
import { cn } from "@/lib/utils";

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

type Connection = {
  icon: React.ElementType;
  label: string;
  description: string;
  status: "connected" | "not_connected";
};

const connections: Connection[] = [
  { icon: SiYoutube, label: "YouTube", description: "Publish Shorts & manage your channel", status: "not_connected" },
  { icon: SiTiktok, label: "TikTok", description: "Post directly to TikTok & view analytics", status: "not_connected" },
  { icon: SiInstagram, label: "Instagram", description: "Share Reels & Stories to your profile", status: "not_connected" },
  { icon: SiGithub, label: "GitHub", description: "Version control & automation scripts", status: "not_connected" },
  { icon: SiSpotify, label: "Spotify", description: "Source trending music for your videos", status: "not_connected" },
  { icon: Music, label: "Audio Library", description: "Royalty-free music & sound effects", status: "not_connected" },
  { icon: Cloud, label: "Cloud Storage", description: "Store & serve video assets at scale", status: "not_connected" },
  { icon: BarChart3, label: "Analytics", description: "Views, engagement & audience insights", status: "not_connected" },
];

const SettingsPopup = ({ isOpen, onClose }: SettingsPopupProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Integrations</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Connect your platforms & tools</p>
            </div>
            <button
              onClick={onClose}
              data-testid="button-close-settings"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-2 max-h-[58vh] overflow-y-auto">
            {connections.map((conn) => (
              <button
                key={conn.label}
                data-testid={`integration-${conn.label.toLowerCase().replace(/\s/g, "-")}`}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60 active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <conn.icon className="h-[17px] w-[17px] text-foreground/75" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground">{conn.label}</span>
                    <span className={cn(
                      "shrink-0 text-[10px] px-2 py-0.5 rounded-full",
                      conn.status === "connected"
                        ? "bg-foreground/10 text-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {conn.status === "connected" ? "Connected" : "Connect"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{conn.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Connect platforms to publish and distribute your videos
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPopup;
