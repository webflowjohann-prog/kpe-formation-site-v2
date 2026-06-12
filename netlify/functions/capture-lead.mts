import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async (req: Request, context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const { email, nom, telephone, source } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "L'email est requis" }),
        { status: 400, headers }
      );
    }

    // Insert into kpe_leads
    const { data, error } = await supabaseAdmin
      .from("kpe_leads")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          nom: nom || "",
          telephone: telephone || null,
          source: source || "landing_page",
        },
        { onConflict: "email", ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error && !error.message.includes("duplicate")) {
      console.error("Supabase insert error:", error.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement" }),
        { status: 500, headers }
      );
    }

    // Optional: send notification to admin via Resend
    const resendApiKey = Netlify.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "KPE Formation <noreply@ikonik-ac.com>",
          to: ["contact@formation-kinesiologie.com"],
          subject: `Nouveau lead KPE : ${nom || email}`,
          html: `
            <h3>Nouveau prospect sur le site KPE</h3>
            <p><strong>Nom :</strong> ${nom || "Non renseigné"}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Téléphone :</strong> ${telephone || "Non renseigné"}</p>
            <p><strong>Source :</strong> ${source || "landing_page"}</p>
            <p><em>Enregistré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</em></p>
          `,
        }),
      }).catch((e) => console.error("Resend notification error:", e));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Merci ! Nous vous recontacterons très bientôt.",
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error("capture-lead error:", err.message);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers }
    );
  }
};

export const config: Config = {
  path: "/api/capture-lead",
};
