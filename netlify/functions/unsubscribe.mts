import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const UNSUBSCRIBE_SECRET =
  Netlify.env.get("UNSUBSCRIBE_SECRET") ||
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

// Vérifie un token signé
function verifyToken(token: string): { lead_id: string; email: string; ts: number } | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = createHmac("sha256", UNSUBSCRIBE_SECRET)
      .update(data)
      .digest("base64url")
      .slice(0, 32);
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);

  // ========== GET : retourne infos du lead ==========
  if (req.method === "GET") {
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Token manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, email, first_name, subscribed")
      .eq("id", decoded.lead_id)
      .single();

    if (!lead) {
      // Fallback : si pas trouvé par ID, chercher par email
      const { data: leadByEmail } = await supabaseAdmin
        .from("leads")
        .select("id, email, first_name, subscribed")
        .eq("email", decoded.email)
        .single();

      if (!leadByEmail) {
        return new Response(JSON.stringify({ error: "Lead introuvable" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        email: leadByEmail.email,
        first_name: leadByEmail.first_name,
        already_unsubscribed: !leadByEmail.subscribed,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      email: lead.email,
      first_name: lead.first_name,
      already_unsubscribed: !lead.subscribed,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ========== POST : effectue la désinscription ==========
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); }
    catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = verifyToken(body.token);
    if (!decoded) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Désinscrire (par ID, fallback par email)
    const updatePayload = {
      subscribed: false,
      unsubscribed_at: new Date().toISOString(),
      status: "unsubscribed",
    };

    let { error } = await supabaseAdmin
      .from("leads")
      .update(updatePayload)
      .eq("id", decoded.lead_id);

    if (error) {
      // Fallback par email
      const { error: emailErr } = await supabaseAdmin
        .from("leads")
        .update(updatePayload)
        .eq("email", decoded.email);

      if (emailErr) {
        return new Response(JSON.stringify({ error: emailErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, message: "Désinscription effectuée" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/unsubscribe",
};
