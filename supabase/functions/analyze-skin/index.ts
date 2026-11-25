import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (type === "chat") {
      const { messages } = await req.json().catch(() => ({ messages: [] }));
      // For chat mode, handled below
    }

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
