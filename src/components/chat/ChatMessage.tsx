import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  workingState?: string | null;
}

const ChatMessageComponent = ({ message, workingState }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── User bubble ── */
  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[78%] rounded-2xl bg-secondary px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── Thinking indicator ── */
  const isEmpty = !message.content || message.content.trim() === "";
  if (isEmpty && workingState) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          <span className="text-xs text-muted-foreground">{workingState}</span>
        </div>
      </div>
    );
  }
  if (isEmpty) return null;

  /* ── AI response ── */
  return (
    <div className="group px-4 py-3">
      <div className="max-w-[88%]">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0 leading-snug">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold text-foreground mb-2 mt-4 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold text-foreground mb-1.5 mt-3 first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-foreground/90 mb-2.5 last:mb-0 leading-relaxed">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/70">{children}</em>
              ),
              hr: () => <hr className="border-border my-4" />,
              ul: ({ children }) => (
                <ul className="my-2 space-y-1 pl-4 list-disc text-sm text-foreground/90">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 space-y-1 pl-4 list-decimal text-sm text-foreground/90">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-sm text-foreground/90 leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-3 my-2.5 text-sm text-muted-foreground leading-relaxed">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-70 break-words"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src as string}
                  alt={alt || ""}
                  loading="lazy"
                  className="my-3 rounded-lg border border-border max-w-full h-auto"
                />
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                const lang = className?.replace("language-", "") || "code";
                if (isBlock) {
                  return (
                    <div className="relative my-3 rounded-lg overflow-hidden border border-border">
                      <div className="flex items-center justify-between bg-secondary px-3 py-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          {lang}
                        </span>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="bg-secondary/40 p-3 overflow-x-auto text-xs leading-relaxed">
                        <code className="font-mono text-foreground/90">{children}</code>
                      </pre>
                    </div>
                  );
                }
                return (
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
