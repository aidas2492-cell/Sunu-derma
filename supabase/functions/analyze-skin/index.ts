import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Limite anti-abus par utilisateur et par jour (à ajuster selon l'offre Gratuit/Premium).
const DAILY_ANALYSIS_LIMIT = 5;


// Vérifie l'utilisateur connecté et consomme une unité de quota côté serveur.
// Renvoie une Response d'erreur si l'appel doit être refusé, sinon null.
async function checkAuthAndQuota(req: Request, kind: "analysis" | "chat", limit: number): Promise<Response | null> {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Connexion requise." }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: "Connexion requise." }, 401);

  const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_quota", { _kind: kind, _limit: limit });
  if (quotaError) {
    console.error("quota error:", quotaError);
    return json({ error: "Service momentanément indisponible." }, 500);
  }
  if (!allowed) return json({ error: "Limite quotidienne atteinte. Réessayez demain." }, 429);

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const denied = await checkAuthAndQuota(req, "analysis", DAILY_ANALYSIS_LIMIT);
    if (denied) return denied;

    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un dermatologue IA expert de Sunu Derma, spécialisé dans les peaux africaines et métissées.
Analyse l'image de peau fournie et retourne un JSON structuré avec:
- score: score global de santé cutanée (0-100)
- hydration: niveau d'hydratation (0-100)
- elasticity: élasticité (0-100)  
- clarity: clarté/luminosité (0-100)
- conditions: tableau des conditions détectées (ex: acné, taches, sécheresse)
- severity: niveau de sévérité ("léger", "modéré", "sévère")
- recommendations: tableau de 3-5 recommandations personnalisées
- routine_matin: tableau de produits/étapes pour le matin
- routine_soir: tableau de produits/étapes pour le soir
- fitzpatrick: type Fitzpatrick estimé (I-VI)
Réponds UNIQUEMENT en JSON valide, sans markdown.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analyse cette image de peau et donne-moi les résultats détaillés." },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // If not valid JSON, extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { raw: content };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-skin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
