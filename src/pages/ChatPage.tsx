import { useState, useRef, useCallback, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageComponent from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import { ChatMessage, Conversation } from "@/types/chat";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const generateId = () => Math.random().toString(36).slice(2, 10);

/* ─────────────────────────────────────────────
   Working state sequences by task type
───────────────────────────────────────────── */
const STATES_CODE     = ["Thinking...", "Planning...", "Building...", "Writing...", "Running...", "Exporting..."];
const STATES_VIDEO    = ["Thinking...", "Analyzing...", "Creating...", "Writing...", "Rendering..."];
const STATES_RESEARCH = ["Thinking...", "Searching...", "Researching...", "Analyzing...", "Working..."];
const STATES_EDIT     = ["Thinking...", "Analyzing...", "Editing...", "Working..."];
const STATES_DEFAULT  = ["Thinking...", "Analyzing...", "Working...", "Creating..."];

function getWorkingStates(prompt: string, isEdit: boolean): string[] {
  if (isEdit) return STATES_EDIT;
  const p = prompt.toLowerCase();
  if (/html|css|javascript|website|code|app|build|create a\s+\w+\s+(site|page|app)/.test(p)) return STATES_CODE;
  if (/video|script|hook|reel|tiktok|shorts|youtube|content/.test(p)) return STATES_VIDEO;
  if (/research|find|search|what is|how to|explain|tell me|why/.test(p)) return STATES_RESEARCH;
  return STATES_DEFAULT;
}

/* ─────────────────────────────────────────────
   AI content builder — task-aware templates
───────────────────────────────────────────── */
function buildAIContent(prompt: string, isEdit: boolean): string {
  const p = prompt.toLowerCase();
  const short = prompt.slice(0, 80) + (prompt.length > 80 ? "…" : "");

  if (isEdit) {
    return `Got it — updating based on your direction.

## Changes Applied

**Your request:** ${short}

Analyzing the existing content and applying your changes...

---

## What I Updated

- Revised the core sections to match your direction
- Adjusted tone, pacing, and emphasis accordingly
- Sharpened the hook and CTA to fit the new angle

Working through the revision...

---

## Revised Hook Lines

> "This changes everything about how you approach..."
> "Nobody's talking about the real reason this works..."
> "Here's what I discovered after 30 days of testing this..."

---

## Updated Storyboard

**Scene 1 (0–3s)** — New opening hook based on your direction

**Scene 2 (3–12s)** — Refined problem framing

**Scene 3 (12–48s)** — Updated solution with your angle applied

**Scene 4 (48–60s)** — Polished, on-brand CTA

---

**Done.** Revisions applied. Ask me to refine any section further, adjust the tone, or start a completely new script from scratch.`;
  }

  /* ── Code / website request ── */
  if (/html|css|javascript|website|code|app|build|create a\s+\w+\s+(site|page|app)/.test(p)) {
    return `Got it — I'll build this from scratch. Let me plan the architecture first.

## Plan

- **HTML** — Semantic layout, accessibility-first markup
- **CSS** — Mobile-first responsive design system
- **JavaScript** — Smooth interactions, form logic, and animations

Starting with the HTML foundation...

---

## index.html

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HealthCare+</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav class="nav">
      <span class="logo">HealthCare+</span>
      <ul class="links">
        <li><a href="#home">Home</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section id="home" class="hero">
    <h1>Your Health,<br>Our Priority</h1>
    <p>Compassionate, expert care for every stage of life.</p>
    <a href="#contact" class="btn">Book Appointment</a>
  </section>

  <section id="services" class="services">
    <h2>Our Services</h2>
    <div class="grid">
      <div class="card">🩺 General Medicine</div>
      <div class="card">🦷 Dental Care</div>
      <div class="card">👁 Eye Care</div>
      <div class="card">💊 Pharmacy</div>
    </div>
  </section>

  <section id="contact" class="contact">
    <h2>Book an Appointment</h2>
    <form id="form">
      <input type="text" placeholder="Full Name" required>
      <input type="email" placeholder="Email" required>
      <textarea rows="3" placeholder="Describe your concern"></textarea>
      <button type="submit">Send Request</button>
    </form>
  </section>

  <footer><p>© 2025 HealthCare+. All rights reserved.</p></footer>
  <script src="script.js"></script>
</body>
</html>
\`\`\`

HTML complete. Writing the CSS now...

---

## style.css

\`\`\`css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
:root { --blue: #2563eb; --bg: #f8fafc; --text: #1e293b; --muted: #64748b }
body { font-family: system-ui, sans-serif; color: var(--text); background: var(--bg) }

.nav { display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 2rem; background: #fff; position: sticky; top: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,.08) }
.logo { font-weight: 800; color: var(--blue); font-size: 1.1rem }
.links { display: flex; gap: 1.5rem; list-style: none }
.links a { color: var(--muted); text-decoration: none; font-weight: 500;
  transition: color .2s }
.links a:hover { color: var(--blue) }

.hero { text-align: center; padding: 6rem 2rem;
  background: linear-gradient(135deg, #eff6ff, #f8fafc) }
.hero h1 { font-size: clamp(2rem, 6vw, 4rem); font-weight: 900;
  line-height: 1.1; margin-bottom: 1rem }
.hero p { color: var(--muted); font-size: 1.125rem; margin-bottom: 2rem }
.btn { background: var(--blue); color: #fff; padding: .875rem 2rem;
  border-radius: 9999px; text-decoration: none; font-weight: 700;
  transition: opacity .2s }
.btn:hover { opacity: .85 }

.services { max-width: 1000px; margin: 0 auto; padding: 5rem 2rem; text-align: center }
.services h2 { font-size: 2rem; margin-bottom: 2.5rem }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem;
  padding: 2rem 1rem; font-weight: 600; font-size: 1rem }

.contact { background: #fff; padding: 5rem 2rem; text-align: center }
.contact h2 { font-size: 2rem; margin-bottom: 2rem }
#form { display: flex; flex-direction: column; gap: .85rem;
  max-width: 460px; margin: 0 auto }
#form input, #form textarea { padding: .85rem 1rem; border: 1px solid #e2e8f0;
  border-radius: .75rem; font: inherit; width: 100% }
#form button { background: var(--blue); color: #fff; border: none;
  border-radius: 9999px; padding: .875rem; font-weight: 700;
  cursor: pointer; transition: background .2s }

footer { text-align: center; padding: 2rem; background: var(--text);
  color: #94a3b8; font-size: .875rem }

@media (max-width: 640px) { .links { display: none } }
\`\`\`

CSS done. Adding the JavaScript interactions now...

---

## script.js

\`\`\`javascript
document.addEventListener('DOMContentLoaded', () => {

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      document.querySelector(a.getAttribute('href'))
        ?.scrollIntoView({ behavior: 'smooth' })
    })
  })

  // Contact form with feedback
  const form = document.getElementById('form')
  form.addEventListener('submit', e => {
    e.preventDefault()
    const btn = form.querySelector('button')
    btn.textContent = '✓ Request Sent!'
    btn.style.background = '#16a34a'
    setTimeout(() => {
      form.reset()
      btn.textContent = 'Send Request'
      btn.style.background = ''
    }, 3000)
  })

  // Scroll-reveal animation
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1'
        e.target.style.transform = 'translateY(0)'
      }
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.card, .services, .contact').forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
    observer.observe(el)
  })

})
\`\`\`

---

**All done.** Three production-ready files — \`index.html\`, \`style.css\`, and \`script.js\`. The site features a sticky nav, bold hero section with CTA, responsive services grid, appointment form with submission feedback, smooth scroll, and scroll-reveal animations. Just open \`index.html\` in any browser to preview.`;
  }

  /* ── Research / info request ── */
  if (/research|find|search|what is|how to|explain|tell me|why|who|when|where/.test(p)) {
    return `Got it — researching this now. Let me find the most relevant information.

## Topic

**Query:** ${short}

Pulling together key information and insights...

---

## Overview

This topic touches on several important areas. Here's what the evidence and best sources show:

**Core insight:** The key thing to understand is that most people approach this from the wrong angle. The real driver isn't what it appears on the surface — it's the underlying mechanism that matters most.

**What most miss:** There's a nuance here that changes the entire picture once you understand it.

Compiling actionable takeaways now...

---

## Key Points

- **First** — The foundational principle that everything else builds on
- **Second** — A counterintuitive finding that challenges common assumptions
- **Third** — The practical application most people overlook
- **Fourth** — How this changes your approach going forward

---

## Actionable Takeaways

1. **Start here** — Focus on the fundamentals before anything else
2. **Avoid this** — The most common mistake that kills results early
3. **Do this instead** — The approach that top performers actually use
4. **Measure this** — The metric that tells you if it's actually working

---

## Quick Summary

> Understanding this deeply gives you a significant edge over those who only know the surface-level version.

---

**Research complete.** Want me to go deeper on any specific angle, turn this into a video script, or break down a particular aspect further?`;
  }

  /* ── Default: video script ── */
  return `Got it — I'll craft a high-retention script for this. Thinking through the best angle first.

## Strategy

**Concept:** ${short}
**Format:** 30–60 seconds · 9:16 vertical
**Hook type:** Pattern interrupt — grabs attention in under 2 seconds

Analyzing the audience and best hook approach...

---

## Audience Profile

- **Age:** 18–34, mobile-first consumers
- **Behavior:** Stops at strong openers, shares relatable content
- **Trigger:** Curiosity gaps, quick wins, and transformation stories

Crafting the full script now...

---

## Full Script

**[0–3s — Hook]**

> "Most people do this completely wrong — and it's costing them."

**[3–12s — Problem]**

Here's what nobody tells you: the way most people approach this almost guarantees average results. The issue isn't effort — it's strategy.

**[12–45s — Solution]**

Here's the 3-step approach that actually moves the needle:

1. **First** — Stop doing what everyone else is doing. Identify what's actually working, not what looks good.
2. **Then** — Apply this one shift in how you think about it. It changes everything.
3. **Finally** — Stay consistent with *this* specific thing, not everything at once. That's where results compound.

The people getting results aren't working harder — they're working on the right things.

**[45–60s — CTA]**

Follow for part 2 dropping soon — I'm breaking down the exact system step by step. Share this with someone who needs a different approach.

Writing production notes...

---

## Production Notes

- **Captions** — Bold keywords, high-contrast colors on every phrase
- **B-roll** — 3–4 clips per beat, avoid static talking head
- **Music** — Start soft, build energy at the solution section
- **Hook frame** — Start mid-action or with a direct, provocative statement
- **Pacing** — Hard cut every 2–3 seconds to maintain 80%+ retention
- **Thumbnail** — Strong facial expression + 3-word text overlay

---

**Script complete.** This is structured for maximum watch time — strong hook, clear value delivery, and a CTA that creates urgency. Swap in your specific examples and stories to make it personal. Ready to record.`;
}

/* ─────────────────────────────────────────────
   ChatPage component
───────────────────────────────────────────── */
const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, addConversation, updateConversation, activeConvId, setActiveConvId } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workingState, setWorkingState] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;

  /* ── Helpers ── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }, []);

  const clearTimers = useCallback(() => {
    if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null; }
    if (stateRef.current)  { clearInterval(stateRef.current);  stateRef.current  = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  /* ── Pending prompt after login ── */
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_prompt");
    if (pending) {
      sessionStorage.removeItem("pending_prompt");
      sessionStorage.removeItem("pending_type");
      handleSendMessage(pending);
    }
  }, []);

  /* ── Title helper: cap at 12 chars ── */
  const displayTitle = (() => {
    const raw = workingState && !activeConversation?.title
      ? workingState
      : activeConversation?.title ?? "Elite Veo";
    return raw.length > 12 ? raw.slice(0, 12) + "…" : raw;
  })();

  /* ── AI streaming engine ── */
  const startAIReply = (convId: string, prompt: string, isEdit: boolean) => {
    clearTimers();
    setIsLoading(true);

    const states = getWorkingStates(prompt, isEdit);
    setWorkingState(states[0]); // "Thinking..."

    // After initial thinking delay, create message and start streaming
    setTimeout(() => {
      const aiMsgId = generateId();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      updateConversation(convId, (c) => ({ ...c, messages: [...c.messages, aiMsg] }));
      scrollToBottom();

      // Cycle working states every 1800ms
      let stateIdx = 1;
      setWorkingState(states[1] ?? states[0]);
      stateRef.current = setInterval(() => {
        if (stateIdx < states.length - 1) {
          stateIdx++;
          setWorkingState(states[stateIdx]);
        }
      }, 1800);

      // Stream content line by line
      const lines = buildAIContent(prompt, isEdit).split("\n");
      let linePos = 0;

      streamRef.current = setInterval(() => {
        if (linePos >= lines.length) {
          clearTimers();
          setWorkingState(null);
          setIsLoading(false);
          scrollToBottom();
          return;
        }
        linePos++;
        const partial = lines.slice(0, linePos).join("\n");
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === aiMsgId ? { ...m, content: partial } : m
          ),
        }));
        scrollToBottom();
      }, 110);

    }, 1600); // thinking delay
  };

  /* ── Send message ── */
  const handleSendMessage = (content: string) => {
    const isEdit = !!activeConvId;
    let convId = activeConvId;

    if (!convId) {
      const newConv: Conversation = {
        id: generateId(),
        title: content.slice(0, 60) + (content.length > 60 ? "…" : ""),
        messages: [],
        createdAt: new Date(),
        videoType: "short",
      };
      addConversation(newConv);
      convId = newConv.id;
      setActiveConvId(convId);
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    updateConversation(convId, (c) => ({
      ...c,
      messages: [...c.messages, userMsg],
      title: c.messages.length === 0 ? content.slice(0, 60) : c.title,
    }));

    scrollToBottom();
    startAIReply(convId, content, isEdit);
  };

  const handleNewChat = () => {
    clearTimers();
    setIsLoading(false);
    setWorkingState(null);
    setActiveConvId(null);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">

      {/* ── Sidebar ── */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
        onNewConversation={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="relative flex items-center px-4 py-3 lg:hidden border-b border-border/20">
          <button
            data-testid="button-open-sidebar"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Dynamic title — capped at 12 chars */}
          <span className="absolute inset-x-14 text-center text-sm font-semibold text-foreground truncate pointer-events-none transition-all duration-300">
            {displayTitle}
          </span>

          <div className="flex-1" />

          {/* Right: avatar or Get Started */}
          {user ? (
            <button
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-sm"
            >
              {user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </button>
          ) : (
            <button
              onClick={() => navigate("/signup")}
              className="shrink-0 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Messages / Welcome */}
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSendMessage} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl py-4 pb-2">
              {activeConversation.messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        )}

        {/* ── Working state indicator ── */}
        {workingState && (
          <div className="shrink-0 flex items-center gap-2 px-5 py-2 border-t border-border/10 bg-background/80">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 130}ms` }}
                />
              ))}
            </span>
            <span className="text-[12px] font-medium text-primary/80 tracking-wide">
              {workingState}
            </span>
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;
