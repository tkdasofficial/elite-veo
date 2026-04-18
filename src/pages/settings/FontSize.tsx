import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { SettingsPage, ls } from "@/components/settings/shared";
import { toast } from "sonner";

const SIZES = [
  { label: "Small",       desc: "Compact — more content at once",    cls: "text-sm",  scale: "text-sm"  },
  { label: "Medium",      desc: "Default — balanced readability",     cls: "text-base", scale: "text-base" },
  { label: "Large",       desc: "Comfortable — easier on the eyes",   cls: "text-lg",  scale: "text-lg"  },
  { label: "Extra Large", desc: "Maximum — best accessibility",       cls: "text-xl",  scale: "text-xl"  },
];

const FontSize = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => ls.get("ev_font_size", "Medium"));

  const pick = (label: string, scale: string) => {
    setSelected(label);
    ls.set("ev_font_size", label);
    document.documentElement.setAttribute("data-font-size", scale);
    toast.success(`Font size set to ${label}`);
  };

  const previewCls = SIZES.find((s) => s.label === selected)?.cls ?? "text-base";

  return (
    <SettingsPage title="Font Size" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10 max-w-md mx-auto w-full space-y-4">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {SIZES.map(({ label, desc, cls, scale }) => (
            <button
              key={label}
              onClick={() => pick(label, scale)}
              className="flex w-full items-center justify-between px-4 py-4 hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
            >
              <div className="text-left">
                <p className={`font-semibold text-foreground ${cls}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
                  selected === label ? "border-primary bg-primary" : "border-border/40"
                }`}
              >
                {selected === label && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-border/30 px-5 py-4 space-y-1">
          <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-2">Preview</p>
          <p className={`text-foreground font-medium leading-relaxed ${previewCls}`}>
            The quick brown fox jumps over the lazy dog.
          </p>
          <p className={`text-muted-foreground leading-relaxed ${previewCls}`}>
            Elite Veo helps you create smarter, faster.
          </p>
        </div>
      </div>
    </SettingsPage>
  );
};

export default FontSize;
