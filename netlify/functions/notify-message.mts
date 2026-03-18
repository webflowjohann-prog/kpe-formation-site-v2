import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { studentEmail, studentName } = await req.json();
    const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey || !studentEmail) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SITE_URL =
      Netlify.env.get("SITE_URL") || "https://kpe-formation-site.netlify.app";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KPE Formation <noreply@ikonik-ac.com>",
        to: [studentEmail],
        subject: "Nouveau message de votre formateur - KPE Formation",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; font-size: 20px;">Nouveau message de Jo\u00ebl Prieur</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Bonjour${studentName ? ` ${studentName}` : ""},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Vous avez re\u00e7u un nouveau message de votre formateur dans votre espace \u00e9l\u00e8ve KPE.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${SITE_URL}/espace-eleve/"
                 style="background-color: #c8a44e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                Voir le message
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              KPE Formation \u2013 Kin\u00e9siologie Professionnelle et \u00c9nerg\u00e9tique
            </p>
          </div>
        `,
      }),
    });

    if (emailResponse.ok) {
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const errText = await emailResponse.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/notify-message",
};
