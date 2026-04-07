import type { Config } from "@netlify/functions";

// Ping Supabase toutes les 24h pour empêcher la mise en pause automatique
// des projets Free (pause après 7 jours d'inactivité)
export default async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
  }

  try {
    // Simple query pour garder la base active
    const res = await fetch(`${supabaseUrl}/rest/v1/modules?select=id&limit=1`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    const data = await res.json();

    console.log(`[keep-alive] Ping Supabase OK — ${new Date().toISOString()} — ${JSON.stringify(data).slice(0, 100)}`);

    return new Response(JSON.stringify({ 
      status: "alive", 
      timestamp: new Date().toISOString(),
      supabase: res.ok ? "healthy" : "error"
    }), { status: 200 });

  } catch (err) {
    console.error(`[keep-alive] Erreur ping Supabase:`, err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

// Exécution toutes les 24h (une fois par jour à 6h du matin)
export const config: Config = {
  schedule: "0 6 * * *",
};
