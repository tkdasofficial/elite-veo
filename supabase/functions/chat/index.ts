// Streaming chat: Groq primary → Gemini fallback. Public function.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Speed/quality tiers map to provider-specific models
const GROQ_MODELS: Record<string, string> = {
  fast: "llama-3.1-8b-instant",
  pro: "llama-3.3-70b-versatile",
  reasoning: "openai/gpt-oss-120b",
};
const GEMINI_MODELS: Record<string, string> = {
  fast: "gemini-2.5-flash",
  pro: "gemini-2.5-flash",
  reasoning: "gemini-2.5-flash",
};

const SYSTEM_PROMPT =
  "You are Elite Veo, a helpful AI assistant. Be clear, concise and friendly. Use markdown when helpful.";

interface ChatMsg { role: "user" | "assistant" | "system"; content: string }

async function streamGroq(messages: ChatMsg[], model: string): Promise<Response> {
  return await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      temperature: 0.7,
    }),
  });
}

async function streamGemini(messages: ChatMsg[], model: string): Promise<Response> {
  // Convert OpenAI-style messages to Gemini contents
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!upstream.ok || !upstream.body) return upstream;

  // Re-shape Gemini SSE → OpenAI-style SSE so the client parser is unified
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const text = parsed?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text || "")
                .join("") || "";
              if (text) {
                const out = { choices: [{ delta: { content: text } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
              }
            } catch { /* ignore partials */ }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("gemini stream error", e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, tier = "fast" } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqModel = GROQ_MODELS[tier] || GROQ_MODELS.fast;
    const geminiModel = GEMINI_MODELS[tier] || GEMINI_MODELS.fast;

    // Try Groq first
    let response: Response | null = null;
    if (GROQ_API_KEY) {
      try {
        const r = await streamGroq(messages, groqModel);
        if (r.ok && r.body) {
          response = new Response(r.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        } else {
          console.error("Groq failed:", r.status, await r.text());
        }
      } catch (e) {
        console.error("Groq exception:", e);
      }
    }

    // Fallback to Gemini
    if (!response && GEMINI_API_KEY) {
      try {
        const r = await streamGemini(messages, geminiModel);
        if (r.ok && r.body) {
          response = new Response(r.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        } else {
          console.error("Gemini failed:", r.status, await r.text());
        }
      } catch (e) {
        console.error("Gemini exception:", e);
      }
    }

    if (!response) {
      return new Response(JSON.stringify({ error: "All AI providers failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return response;
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
