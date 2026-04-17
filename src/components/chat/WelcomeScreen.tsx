import { ArrowRight } from "lucide-react";

const suggestions = [
  "Write a hook for a morning routine reel",
  "Script a 60s product review for earbuds",
  "Plan a travel vlog montage at Bali sunset",
  "Create a TikTok about a healthy pasta recipe",
  "Write a cinematic city-walk clip concept",
  "Help me go viral with a motivation short",
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="my-auto w-full max-w-2xl mx-auto flex flex-col items-center text-center px-4 py-6">

        {/* Logo */}
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl overflow-hidden mb-4 sm:mb-5 shrink-0 shadow-lg">
          <img src="/logo.png" alt="Elite Veo" className="h-full w-full object-cover" />
        </div>

        <h1 className="text-xl sm:text-3xl font-semibold text-foreground mb-4 sm:mb-8 leading-snug">
          What video should we create?
        </h1>

        {/* Suggestion pills */}
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
          {suggestions.map((s, i) => (
            <button
              key={i}
              data-testid={`suggestion-${i}`}
              onClick={() => onSuggestionClick(s)}
              className="flex items-center justify-between gap-3 rounded-full border border-border/50 bg-secondary/30 px-5 py-3 text-left text-[13px] text-foreground/75 hover:bg-secondary/60 hover:text-foreground hover:border-primary/40 transition-all active:scale-[0.98] group"
            >
              <span className="truncate">{s}</span>
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-border/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
