import { useState, useRef, useCallback } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
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
    onSend(text);
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

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="mx-auto max-w-3xl">
        {/* Input card */}
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

          <div className="flex items-center justify-between mt-2">
            {/* Attach */}
            <div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              <button
                type="button"
                data-testid="button-attach"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>

            {/* Send */}
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
