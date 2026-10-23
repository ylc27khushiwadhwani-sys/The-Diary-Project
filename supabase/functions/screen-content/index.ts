// Supabase Edge Function: screen-content
// Deno runtime for automated AI safety screening before public release

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import sharedPatterns from "../_shared/moderation-patterns.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScreenRequest {
  content: string;
  title?: string;
}

// Heuristic emergency safety patterns to guarantee offline and zero-latency
// safety. One shared source with the client-side fallback: both sides compile
// these string patterns identically, so the two classifiers cannot drift apart.
const compilePatterns = (entries: { pattern: string; flags: string }[]) =>
  entries.map((entry) => new RegExp(entry.pattern, entry.flags));

const SELF_HARM_PATTERNS = compilePatterns(sharedPatterns.selfHarmPatterns);
const PII_PATTERNS = compilePatterns(sharedPatterns.piiPatterns);

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
    let externalCategory = "";

    if (apiKey && !isSelfHarm && !isPII) {
      // Bounded external call: abort after 5s so a hung request degrades to the
      // local heuristic verdicts below instead of stalling the screening call.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ input: fullText, model: "omni-moderation-latest" }),
          signal: controller.signal,
        });

        if (response.ok) {
          const result = await response.json();
          const flags = result.results?.[0]?.categories;
          if (flags?.["self-harm"] || flags?.["self-harm/intent"]) {
            externalCategory = "self_harm";
          } else if (flags?.harassment || flags?.hate) {
            externalCategory = "abuse";
          }
        }
      } catch {
        // Timed out or unreachable: the local heuristic verdicts below are the fallback.
      } finally {
        clearTimeout(timeoutId);
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
      JSON.stringify({ error: error instanceof Error ? error.message : String(error), status: "held_private", allowed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
