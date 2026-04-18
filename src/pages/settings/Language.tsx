import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { SettingsPage, ls } from "@/components/settings/shared";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English",    native: "English"    },
  { code: "es", label: "Spanish",    native: "Español"    },
  { code: "fr", label: "French",     native: "Français"   },
  { code: "de", label: "German",     native: "Deutsch"    },
  { code: "pt", label: "Portuguese", native: "Português"  },
  { code: "hi", label: "Hindi",      native: "हिंदी"       },
  { code: "ar", label: "Arabic",     native: "العربية"    },
  { code: "zh", label: "Chinese",    native: "中文"        },
  { code: "ja", label: "Japanese",   native: "日本語"      },
  { code: "ko", label: "Korean",     native: "한국어"      },
  { code: "tr", label: "Turkish",    native: "Türkçe"     },
  { code: "ru", label: "Russian",    native: "Русский"    },
  { code: "it", label: "Italian",    native: "Italiano"   },
  { code: "nl", label: "Dutch",      native: "Nederlands" },
];

const Language = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => ls.get("ev_language", "English"));

  const pick = (label: string) => {
    setSelected(label);
    ls.set("ev_language", label);
    toast.success(`Language set to ${label}`);
  };

  return (
    <SettingsPage title="Language" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-5 pb-10">
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20">
          {LANGUAGES.map(({ label, native }) => (
            <button
              key={label}
              onClick={() => pick(label)}
              className="flex w-full items-center justify-between px-4 py-3.5 hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{native}</p>
              </div>
              {selected === label && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/40 text-center mt-5 leading-relaxed">
          Full UI translation is coming soon. English is currently active.
        </p>
      </div>
    </SettingsPage>
  );
};

export default Language;
