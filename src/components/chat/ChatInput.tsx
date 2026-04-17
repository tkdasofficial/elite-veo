import { useState, useRef, useCallback } from "react";
import { ArrowUp, Paperclip, Zap, Sparkles, Brain, ChevronDown, X, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModelTier = "fast" | "pro" | "reasoning";

export interface SendPayload {
  text: string;
  tier: ModelTier;
  attachedImageUrl?: string;
}

interface ChatInputProps {
  onSend: (payload: SendPayload) => void;
  isLoading: boolean;
}

const MODELS: { id: ModelTier; label: string; desc: string; icon: typeof Zap }[] = [
  { id: "fast", label: "Fast", desc: "Quick replies", icon: Zap },
  { id: "pro", label: "Pro", desc: "Best quality", icon: Sparkles },
  { id: "reasoning", label: "Reasoning", desc: "Deep thinking", icon: Brain },
];

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [tier, setTier] = useState<ModelTier>("fast");
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  const handleSend = () => {
    const text = message.trim();
    if ((!text && !attachedImageUrl) || isLoading) return;
    onSend({ text: text || "Describe this image", tier, attachedImageUrl: attachedImageUrl || undefined });
    setMessage("");
    setAttachedImageUrl(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to attach files", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20 MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Image only", description: "Please attach an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("creations").upload(path, file, {
        contentType: file.type,
      });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("creations")
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      if (!signed?.signedUrl) throw new Error("Could not create URL");
      setAttachedImageUrl(signed.signedUrl);
      toast({ title: "Image attached", description: file.name });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const canSend = (message.trim().length > 0 || !!attachedImageUrl) && !isLoading && !uploading;
  const activeModel = MODELS.find((m) => m.id === tier)!;
  const ActiveIcon = activeModel.icon;

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex flex-col rounded-3xl border border-border bg-secondary/40 backdrop-blur-sm px-4 pt-3 pb-3 shadow-sm">
          {attachedImageUrl && (
            <div className="mb-2 inline-flex items-center gap-2 self-start rounded-xl border border-border/60 bg-background/60 p-1.5 pr-3">
              <img src={attachedImageUrl} alt="attached" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-[11px] text-muted-foreground">Image attached</span>
              <button
                onClick={() => setAttachedImageUrl(null)}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); resize(); }}
            onKeyDown={handleKeyDown}
            placeholder={attachedImageUrl ? "Ask about the image, or describe an edit…" : "Message Elite Veo…"}
            data-testid="input-chat"
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-6 min-h-[24px] max-h-[200px]"
          />

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1">
              {user && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <button
                    type="button"
                    data-testid="button-attach"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        data-testid="button-model"
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <ActiveIcon className="h-3.5 w-3.5" />
                        <span>{activeModel.label}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {MODELS.map((m) => {
                        const Icon = m.icon;
                        return (
                          <DropdownMenuItem
                            key={m.id}
                            onClick={() => setTier(m.id)}
                            className="gap-2 cursor-pointer"
                          >
                            <Icon className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{m.label}</span>
                              <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!user && (
                <span className="flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] font-medium text-muted-foreground/70 bg-secondary/50">
                  <Zap className="h-3 w-3" />
                  Guest mode · text only
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              data-testid="button-send"
              disabled={!canSend}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/85 active:scale-95"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-2">
          Elite Veo can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
