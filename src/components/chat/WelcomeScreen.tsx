import { Film, Sparkles, Image as ImageIcon, Search, Wand2, Lightbulb } from "lucide-react";

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
      <div className="my-auto w-full max-w-2xl mx-auto flex flex-col items-center text-center px-4 py-12">

        <h1 className="text-3xl sm:text-[2.25rem] font-semibold text-foreground mb-2 tracking-tight">
          What can I help with?
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Chat, generate images, edit photos, search the web.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                data-testid={`suggestion-${i}`}
                onClick={() => onSuggestionClick(s.text)}
                className="flex items-center gap-3 rounded-xl bg-secondary/60 hover:bg-secondary px-4 py-3.5 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate">{s.text}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
