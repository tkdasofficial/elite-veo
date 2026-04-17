import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

const MyCreations = () => {
  const navigate = useNavigate();
  const { conversations } = useApp();

  const completed = conversations.filter((c) => c.messages.length > 0);

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
          My Creations
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">No creations yet</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Start a conversation and your video scripts will appear here.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create a video
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-2">
            {completed.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate("/")}
                className="w-full rounded-2xl border border-border bg-card/50 px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{conv.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} ·{" "}
                      {conv.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCreations;
