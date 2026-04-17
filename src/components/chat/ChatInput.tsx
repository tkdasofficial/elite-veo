import { useState, useRef, useCallback } from "react";
import { ArrowUp, Paperclip, Zap, Sparkles, Brain, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModelTier = "fast" | "pro" | "reasoning";

interface ChatInputProps {
  onSend: (message: string, tier: ModelTier) => void;
  isLoading: boolean;
}

const MODELS: { id: ModelTier; label: string; desc: string; icon: typeof Zap }[] = [
  { id: "fast", label: "Fast", desc: "Quick replies", icon: Zap },
  { id: "pro", label: "Pro", desc: "Best quality", icon: Sparkles },
  { id: "reasoning", label: "Reasoning", desc: "Deep thinking", icon: Brain },
];

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [tier, setTier] = useState<ModelTier>("fast");
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
    if (!text || isLoading) return;
    onSend(text, tier);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20 MB", variant: "destructive" });
    } else {
      toast({ title: "File attached", description: file.name });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = message.trim().length > 0 && !isLoading;
  const activeModel = MODELS.find((m) => m.id === tier)!;
  const ActiveIcon = activeModel.icon;

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex flex-col rounded-3xl border border-border bg-secondary/40 backdrop-blur-sm px-4 pt-3 pb-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); resize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message Elite Veo…"
            data-testid="input-chat"
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-6 min-h-[24px] max-h-[200px] pr-10"
          />

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              <button
                type="button"
                data-testid="button-attach"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Paperclip className="h-4 w-4" />
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
