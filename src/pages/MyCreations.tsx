import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, Video, Music, FileText, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Creation {
  id: string;
  type: "image" | "video" | "audio" | "text";
  title: string | null;
  prompt: string | null;
  content: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

const typeIcon = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  text: FileText,
};

const MyCreations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("creations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCreations((data as Creation[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="relative flex items-center px-4 py-3 border-b border-border/20 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="absolute inset-x-14 text-center text-sm font-semibold text-foreground pointer-events-none">
          My Creations
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 py-20 text-center">
            <p className="font-semibold text-foreground text-base">Sign in to view your creations</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : loading ? (
          <div className="px-4 pt-8 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">No creations yet</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Generated images, videos, and audio will appear here.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create something
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-2">
            {creations.map((c) => {
              const Icon = typeIcon[c.type];
              return (
                <div
                  key={c.id}
                  className="w-full rounded-2xl border border-border bg-card/50 px-4 py-3.5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {c.title || c.prompt || "Untitled"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                        {c.type} · {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCreations;
