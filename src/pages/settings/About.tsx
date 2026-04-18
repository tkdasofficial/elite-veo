import { useNavigate } from "react-router-dom";
import { SettingsPage } from "@/components/settings/shared";

const STACK = [
  ["Platform",      "React · Vite · TypeScript"],
  ["Backend",       "Supabase (Auth · DB · Storage)"],
  ["AI Engine",     "Groq (primary) · Gemini (fallback)"],
  ["Image Gen",     "Freepik Mystic · Gemini Vision"],
  ["Voice",         "Web Speech API"],
  ["Streaming",     "Server-sent Events (SSE)"],
  ["Styling",       "Tailwind CSS · shadcn/ui"],
  ["Deployment",    "Replit Cloud"],
];

const About = () => {
  const navigate = useNavigate();

  return (
    <SettingsPage title="About" onBack={() => navigate("/settings")}>
      <div className="px-4 pt-4 pb-12">
        {/* Logo block */}
        <div className="flex flex-col items-center py-8 gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary text-primary-foreground text-2xl font-black shadow-lg shadow-primary/30">
            EV
          </div>
          <p className="mt-2 text-xl font-black text-foreground tracking-tight">Elite Veo</p>
          <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-muted-foreground">
            Version 1.0.0
          </span>
          <p className="text-xs text-muted-foreground/60 text-center mt-1 leading-relaxed max-w-[220px]">
            Your professional AI-powered content creation assistant.
          </p>
        </div>

        {/* Tech stack */}
        <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2 px-1">
          Built with
        </p>
        <div className="rounded-2xl bg-secondary/30 overflow-hidden divide-y divide-border/20 mb-5">
          {STACK.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-4 py-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-xs font-medium text-foreground text-right max-w-[55%]">{v}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/40">
          © 2025 Elite Veo. All rights reserved.
        </p>
      </div>
    </SettingsPage>
  );
};

export default About;
