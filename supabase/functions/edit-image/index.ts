// Image editing via Gemini Nano Banana (multimodal image edit)
// Falls back is not provided here; Gemini handles single-image edits well.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchAsBase64(url: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return { b64: btoa(bin), mime: r.headers.get("content-type") || "image/png" };
  } catch { return null; }
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
    const { data: userData, error: userErr } = await supaUser.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { prompt, imageUrl, conversationId } = await req.json();
    if (!prompt || !imageUrl) {
      return new Response(JSON.stringify({ error: "prompt and imageUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const img = await fetchAsBase64(imageUrl);
    if (!img) {
      return new Response(JSON.stringify({ error: "Could not load source image" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gemini 2.5 Flash Image (Nano Banana) supports image edit
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: img.mime, data: img.b64 } },
          ],
        }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Gemini edit failed:", r.status, t);
      return new Response(JSON.stringify({ error: "Image edit failed", detail: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p: any) => p.inline_data || p.inlineData);
    const blob = imgPart?.inline_data || imgPart?.inlineData;
    if (!blob?.data) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 → upload
    const bin = atob(blob.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const filename = `${userId}/${crypto.randomUUID()}.png`;
    const supaAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: upErr } = await supaAdmin.storage
      .from("creations")
      .upload(filename, bytes, { contentType: blob.mime_type || "image/png" });
    if (upErr) console.error("Upload error:", upErr);

    const { data: signed } = await supaAdmin.storage
      .from("creations")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);
    const finalUrl = signed?.signedUrl;
    if (!finalUrl) {
      return new Response(JSON.stringify({ error: "Could not create signed URL" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supaAdmin.from("creations").insert({
      user_id: userId,
      conversation_id: conversationId || null,
      type: "image",
      prompt,
      title: `Edit: ${prompt.slice(0, 60)}`,
      file_url: finalUrl,
      thumbnail_url: finalUrl,
      metadata: { provider: "gemini-nano-banana", source: imageUrl },
    });

    return new Response(JSON.stringify({ url: finalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("edit-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
