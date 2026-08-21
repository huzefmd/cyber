import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { phishingRequestSchema } from "@/lib/validation";
import { analyzeUrl } from "@/lib/phishing.server";

export const analyzePhishing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => phishingRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = await analyzeUrl(data.url);

    const { data: row, error } = await supabase
      .from("phishing_scans")
      .insert({
        user_id: userId,
        url: data.url,
        classification: result.classification,
        confidence_score: Math.round(result.confidenceScore),
        ai_explanation: result.explanation,
        threat_indicators: result.threatIndicators,
        recommendations: result.recommendations,
        provider: result.provider,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to persist phishing scan");
    }

    return { ...result, id: row?.id ?? null };
  });
