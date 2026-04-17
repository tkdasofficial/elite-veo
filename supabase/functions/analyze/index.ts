// Vision/file analysis: Groq llama-4-scout (vision) → Gemini 2.5 fallback.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

async function analyzeWithGroq(prompt: string, imageUrl: string): Promise<string | null> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt || "Describe this image in detail." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      }],
    }),
  });
  if (!res.ok) { console.error("Groq vision failed:", res.status, await res.text()); return null; }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || null;
}

async function analyzeWithGemini(prompt: string, imageUrl: string): Promise<string | null> {
  // Fetch image and convert to base64
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const buf = await imgRes.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const mime = imgRes.headers.get("content-type") || "image/png";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt || "Describe this image in detail." },
          { inline_data: { mime_type: mime, data: b64 } },
        ],
      }],
    }),
  });
  if (!res.ok) { console.error("Gemini vision failed:", res.status, await res.text()); return null; }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: string | null = null;
    if (GROQ_API_KEY) result = await analyzeWithGroq(prompt, imageUrl).catch((e) => { console.error(e); return null; });
    if (!result && GEMINI_API_KEY) result = await analyzeWithGemini(prompt, imageUrl).catch((e) => { console.error(e); return null; });

    if (!result) {
      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
