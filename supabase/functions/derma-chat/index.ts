import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Limite anti-abus par utilisateur et par jour (à ajuster selon l'offre Gratuit/Premium).
const DAILY_CHAT_LIMIT = 50;


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
    const denied = await checkAuthAndQuota(req, "chat", DAILY_CHAT_LIMIT);
    if (denied) return denied;

    const body = await req.json();
    // N'accepte que les rôles user/assistant (pas de message "system" injecté par le client),
    // garde les 20 derniers messages et limite leur taille.
    const messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "Message vide." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es l'assistant IA dermatologique de Sunu Derma, spécialisé dans les peaux africaines et métissées.
Tu aides les utilisateurs avec:
- Des conseils de soins de peau personnalisés
- Des informations sur les conditions dermatologiques courantes (acné, eczéma, hyperpigmentation, etc.)
- Des recommandations de routine skincare (matin et soir)
- Des explications sur les ingrédients actifs
- Des conseils de protection solaire adaptés aux peaux foncées

Tu ne poses PAS de diagnostic médical définitif. Tu recommandes toujours de consulter un dermatologue pour les cas sérieux.
Tu réponds en français, de manière claire et bienveillante. Tu utilises des emojis avec parcimonie.
Tu connais bien les produits disponibles en Afrique de l'Ouest.`,
          },
          ...messages,
        ],
        stream: true,
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
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("derma-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
