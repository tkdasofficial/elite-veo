import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessageComponent = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── User bubble — right aligned ── */
  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-secondary/70 border border-border/40 px-4 py-3 shadow-sm">
          <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── AI response — left aligned, pure text ── */
  return (
    <div className="group px-4 py-3">
      <div className="max-w-[88%]">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-foreground mb-3 mt-5 first:mt-0 leading-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[15px] font-semibold text-foreground mb-2 mt-4 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[13px] font-semibold text-foreground/90 mb-1.5 mt-3 first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-[13px] text-foreground/85 mb-2.5 last:mb-0 leading-relaxed">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground text-[12px]">{children}</em>
              ),
              hr: () => <hr className="border-border/30 my-4" />,
              ul: ({ children }) => (
                <ul className="my-2 space-y-1 pl-0 list-none">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-2 space-y-1 pl-4 list-decimal text-[13px] text-foreground/80">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="flex gap-2 text-[13px] text-foreground/80 leading-relaxed">
                  <span className="text-primary shrink-0 mt-0.5">•</span>
                  <span>{children}</span>
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/50 pl-3 my-2.5 italic text-[12px] text-muted-foreground leading-relaxed">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 break-words"
                >
                  {children}
                </a>
              ),
              img: ({ src, alt }) => (
                <img
                  src={src as string}
                  alt={alt || ""}
                  loading="lazy"
                  className="my-3 rounded-xl border border-border/40 max-w-full h-auto"
                />
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                const lang = className?.replace("language-", "") || "code";
                if (isBlock) {
                  return (
                    <div className="relative my-3 rounded-xl overflow-hidden border border-border/40">
                      <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
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
                      <pre className="bg-muted/25 p-3 overflow-x-auto text-[11px] leading-relaxed">
                        <code className="font-mono text-foreground/90">{children}</code>
                      </pre>
                    </div>
                  );
                }
                return (
                  <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[11px] font-mono text-foreground/80">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Copy action — appears on hover */}
        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
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
