// Freepik image generation with auto aspect-ratio detection.
// Uses Freepik Mystic (free tier compatible). Saves to creations bucket + creations table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREEPIK_API_KEY = Deno.env.get("FREEPIK_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Auto-detect aspect ratio from prompt
function detectAspectRatio(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/\b(portrait|vertical|story|reel|tiktok|phone|9:16)\b/.test(p)) return "social_story_9_16";
  if (/\b(landscape|wide|cinematic|banner|youtube|16:9|widescreen)\b/.test(p)) return "widescreen_16_9";
  if (/\b(square|instagram post|1:1|profile)\b/.test(p)) return "square_1_1";
  if (/\b(4:3|standard)\b/.test(p)) return "traditional_3_4";
  if (/\b(poster|tall|3:4)\b/.test(p)) return "social_post_4_5";
  return "square_1_1"; // sensible default
}

async function pollTask(taskId: string): Promise<string | null> {
  // Freepik returns base64 once status is COMPLETED
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
      headers: { "x-freepik-api-key": FREEPIK_API_KEY },
    });
    if (!res.ok) continue;
    const data = await res.json();
    const status = data?.data?.status;
    if (status === "COMPLETED") {
      const url = data?.data?.generated?.[0];
      if (url) return url;
    }
    if (status === "FAILED") return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supaUser.auth.getClaims(token);
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { prompt, conversationId } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aspect_ratio = detectAspectRatio(prompt);

    // Submit Freepik Mystic task
    const submit = await fetch("https://api.freepik.com/v1/ai/mystic", {
      method: "POST",
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
        model: "realism",
        engine: "automatic",
      }),
    });

    if (!submit.ok) {
      const errTxt = await submit.text();
      console.error("Freepik submit failed:", submit.status, errTxt);
      return new Response(JSON.stringify({ error: "Image generation failed", detail: errTxt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const submitData = await submit.json();
    const taskId = submitData?.data?.task_id;
    if (!taskId) {
      return new Response(JSON.stringify({ error: "No task id" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrl = await pollTask(taskId);
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image generation timeout" }), {
        status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download image and upload to storage
    const imgRes = await fetch(imageUrl);
    const imgBuf = new Uint8Array(await imgRes.arrayBuffer());
    const filename = `${userId}/${crypto.randomUUID()}.png`;

    const supaAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: upErr } = await supaAdmin.storage
      .from("creations")
      .upload(filename, imgBuf, { contentType: "image/png" });
    if (upErr) console.error("Upload error:", upErr);

    const { data: signed } = await supaAdmin.storage
      .from("creations")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);

    const finalUrl = signed?.signedUrl || imageUrl;

    // Save to creations table
    await supaAdmin.from("creations").insert({
      user_id: userId,
      conversation_id: conversationId || null,
      type: "image",
      prompt,
      title: prompt.slice(0, 80),
      file_url: finalUrl,
      thumbnail_url: finalUrl,
      metadata: { aspect_ratio, provider: "freepik-mystic" },
    });

    return new Response(JSON.stringify({ url: finalUrl, aspect_ratio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
