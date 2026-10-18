// Supabase Edge Function: screen-content
// Deno runtime for automated AI safety screening before public release

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScreenRequest {
  content: string;
  title?: string;
}

// Heuristic emergency safety patterns to guarantee offline and zero-latency safety
const SELF_HARM_PATTERNS = [
  /suicid/i,
  /kill(?:ing)?\s+myself/i,
  /want(?:ing)?\s+to\s+die/i,
  /end(?:ing)?\s+(?:my|this)\s+life/i,
  /self[- ]harm/i,
  /cut(?:ting)?\s+myself/i,
  /take\s+my\s+(?:own\s+)?life/i,
  /hang(?:ing)?\s+myself/i,
  /overdose/i,
  /better\s+off\s+dead/i,
];

const PII_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number format
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{10}\b/, // 10-digit phone number
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content, title = "" } = (await req.json()) as ScreenRequest;
    const fullText = `${title} ${content}`.trim();

    // 1. Evaluate Self-Harm Risk
    const isSelfHarm = SELF_HARM_PATTERNS.some((pattern) => pattern.test(fullText));

    // 2. Evaluate PII Exposure
    const isPII = PII_PATTERNS.some((pattern) => pattern.test(fullText));

    // 3. Optional: Call external OpenAI / Gemini moderation API if key exists
    const apiKey = Deno.env.get("MODERATION_API_KEY");
    let externalFlagged = false;
    let externalCategory = "";

    if (apiKey && !isSelfHarm && !isPII) {
      try {
        const response = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ input: fullText }),
        });

        if (response.ok) {
          const result = await response.json();
          const flags = result.results?.[0]?.categories;
          if (flags?.["self-harm"] || flags?.["self-harm/intent"]) {
            externalFlagged = true;
            externalCategory = "self_harm";
          } else if (flags?.harassment || flags?.hate) {
            externalFlagged = true;
            externalCategory = "abuse";
          }
        }
      } catch (err) {
        console.warn("External moderation API timed out, falling back to local heuristics:", err);
      }
    }

    const selfHarmTriggered = isSelfHarm || externalCategory === "self_harm";
    const piiTriggered = isPII;
    const abuseTriggered = externalCategory === "abuse";

    if (selfHarmTriggered) {
      return new Response(
        JSON.stringify({
          allowed: false,
          status: "held_private",
          categories: {
            self_harm: true,
            pii: false,
            abuse: false,
          },
          reason: "self_harm",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (piiTriggered || abuseTriggered) {
      return new Response(
        JSON.stringify({
          allowed: false,
          status: "held_private",
          categories: {
            self_harm: false,
            pii: piiTriggered,
            abuse: abuseTriggered,
          },
          reason: piiTriggered ? "pii_detected" : "abusive_language",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Passed clean
    return new Response(
      JSON.stringify({
        allowed: true,
        status: "clean",
        categories: {
          self_harm: false,
          pii: false,
          abuse: false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, status: "held_private", allowed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
