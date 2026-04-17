// Web search & URL analysis: Firecrawl scrape → Groq/Gemini summary stream
// Detects URLs in prompt and extracts content, otherwise treats as research query.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const URL_RE = /(https?:\/\/[^\s)>"']+)/gi;

async function firecrawlScrape(url: string) {
  const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "summary"],
      onlyMainContent: true,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("Firecrawl error:", r.status, t);
    return null;
  }
  const data = await r.json();
  // v2 returns { success, data: { markdown, summary, metadata } }
  const doc = data?.data || data;
  return {
    markdown: doc?.markdown || "",
    summary: doc?.summary || "",
    title: doc?.metadata?.title || url,
    sourceURL: doc?.metadata?.sourceURL || url,
  };
}

async function firecrawlSearch(query: string) {
  const r = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("Firecrawl search error:", r.status, t);
    return [];
  }
  const data = await r.json();
  const results = data?.data?.web || data?.data || [];
  return Array.isArray(results) ? results : [];
}

async function streamSummary(systemPrompt: string, userContent: string): Promise<Response | null> {
  // Try Groq first
  if (GROQ_API_KEY) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
        temperature: 0.4,
      }),
    });
    if (r.ok && r.body) return r;
    console.error("Groq summary failed:", r.status, await r.text());
  }
  // Gemini fallback
  if (GEMINI_API_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });
    if (!upstream.ok || !upstream.body) return null;

    // Reshape Gemini SSE → OpenAI-style SSE
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, i).trim();
              buf = buf.slice(i + 1);
              if (!line.startsWith("data:")) continue;
              const json = line.slice(5).trim();
              if (!json || json === "[DONE]") continue;
              try {
                const p = JSON.parse(json);
                const text = p?.candidates?.[0]?.content?.parts?.map((x: any) => x.text || "").join("") || "";
                if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
              } catch {}
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally { controller.close(); }
      },
    });
    return new Response(stream);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urls = [...prompt.matchAll(URL_RE)].map((m) => m[1]).slice(0, 3);

    let context = "";
    let sources: { title: string; url: string }[] = [];

    if (urls.length > 0) {
      const docs = await Promise.all(urls.map((u) => firecrawlScrape(u).catch(() => null)));
      docs.forEach((d) => {
        if (!d) return;
        sources.push({ title: d.title, url: d.sourceURL });
        const body = (d.markdown || d.summary || "").slice(0, 8000);
        context += `\n\n## Source: ${d.title}\nURL: ${d.sourceURL}\n\n${body}\n`;
      });
    } else {
      // No URL → Firecrawl web search
      const results = await firecrawlSearch(prompt);
      results.slice(0, 5).forEach((r: any) => {
        const title = r.title || r.url || "Result";
        const url = r.url || "";
        sources.push({ title, url });
        const body = (r.markdown || r.description || "").slice(0, 3000);
        context += `\n\n## ${title}\nURL: ${url}\n\n${body}\n`;
      });
    }

    if (!context.trim()) {
      return new Response(JSON.stringify({ error: "No content found for that query/URL" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are Elite Veo's research assistant. The user asked a question; you have web content below.
Write a clear, well-structured markdown answer. Use headings and bullets where helpful.
Cite sources inline like [1], [2] matching the order provided. End with a "## Sources" section listing each source with its number, title and URL as a markdown link.
Be accurate, do not invent information not present in the sources.`;

    const userContent = `User question/URL request:\n${prompt}\n\n---\n\nWeb content:${context}\n\n---\n\nSource list (use these numbers for citations):\n${sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n")}`;

    const summary = await streamSummary(systemPrompt, userContent);
    if (!summary || !summary.body) {
      return new Response(JSON.stringify({ error: "Summarization failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(summary.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("web-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
