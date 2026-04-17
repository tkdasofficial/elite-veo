// Intent router: classifies a user prompt into a workflow.
// Used client-side to route requests to the correct edge function and pick rich working states.

export type Intent = "image" | "edit-image" | "search" | "analyze" | "chat";

const URL_RE = /(https?:\/\/[^\s)>"']+)/i;
const IMAGE_GEN_RE =
  /\b(generate|create|make|draw|paint|design|render|produce|illustrate)\b.*\b(image|picture|photo|art|illustration|logo|poster|wallpaper|portrait|scene|sticker|icon|banner)\b|^(image|picture|photo|art) of\b/i;
const IMAGE_EDIT_RE =
  /\b(edit|change|modify|remove|replace|add|make it|turn (into|to)|recolor|enhance|upscale|restyle|transform)\b/i;
const SEARCH_RE =
  /\b(search|find|look up|google|browse|fetch|scrape|read|summarize|analyse|analyze)\b.*\b(url|website|page|article|news|web|link|site)\b|\b(what is happening|latest news|research|find out|tell me about)\b/i;

export function detectIntent(prompt: string, hasAttachedImage: boolean): Intent {
  const hasUrl = URL_RE.test(prompt);

  if (hasAttachedImage) {
    if (IMAGE_EDIT_RE.test(prompt) || /\b(edit|change|modify)\b/i.test(prompt)) return "edit-image";
    return "analyze";
  }

  if (hasUrl) return "search";
  if (IMAGE_GEN_RE.test(prompt)) return "image";
  if (SEARCH_RE.test(prompt)) return "search";
  return "chat";
}

/* ── Working state sequences per intent ── */
export const WORKING_STATES: Record<Intent, string[]> = {
  chat:         ["Thinking...", "Reasoning...", "Crafting..."],
  image:        ["Thinking...", "Designing...", "Creating...", "Rendering..."],
  "edit-image": ["Thinking...", "Analyzing...", "Editing...", "Transforming...", "Rendering..."],
  search:       ["Thinking...", "Searching...", "Researching...", "Reading...", "Analyzing...", "Crafting..."],
  analyze:      ["Thinking...", "Analyzing...", "Reading...", "Crafting..."],
};

export function statesFor(intent: Intent, prompt?: string): string[] {
  // Slight overrides based on prompt keywords
  if (intent === "chat" && prompt) {
    const p = prompt.toLowerCase();
    if (/\b(code|build|write|function|component|app|html|css|js|python)\b/.test(p))
      return ["Thinking...", "Planning...", "Writing...", "Building...", "Running..."];
    if (/\b(why|how|explain|reasoning)\b/.test(p))
      return ["Thinking...", "Reasoning...", "Working...", "Crafting..."];
  }
  return WORKING_STATES[intent];
}
