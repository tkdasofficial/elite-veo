import { ArrowRight, Sparkles, Image as ImageIcon, Search, Wand2, Film, Lightbulb } from "lucide-react";

const suggestions = [
  { icon: Film,      text: "Write a hook for a morning routine reel" },
  { icon: Sparkles,  text: "Script a 60s product review for earbuds" },
  { icon: ImageIcon, text: "Generate a cinematic Bali sunset poster" },
  { icon: Search,    text: "Summarize https://news.ycombinator.com" },
  { icon: Wand2,     text: "Turn my photo into a watercolor painting" },
  { icon: Lightbulb, text: "Help me go viral with a motivation short" },
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="my-auto w-full max-w-2xl mx-auto flex flex-col items-center text-center px-4 py-8">

        {/* Logo with glow */}
        <div className="relative mb-5 sm:mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl scale-110" aria-hidden />
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/40">
            <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-semibold text-foreground mb-2 leading-tight tracking-tight">
          What should we{" "}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            create
          </span>{" "}
          today?
        </h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-md">
          Chat, generate images, edit photos, summarize URLs, and more — all in one place.
        </p>

        {/* Suggestion grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                data-testid={`suggestion-${i}`}
                onClick={() => onSuggestionClick(s.text)}
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3 text-left text-[13px] text-foreground/80 hover:bg-secondary/60 hover:text-foreground hover:border-primary/40 transition-all active:scale-[0.98] group"
              >
                <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate">{s.text}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
