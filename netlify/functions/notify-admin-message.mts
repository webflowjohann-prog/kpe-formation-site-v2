import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify the sender is an authenticated user
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!user) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { studentName, messagePreview } = await req.json();
    const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";
    const ADMIN_EMAIL = "joel.prieur@gmail.com";

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SITE_URL =
      Netlify.env.get("SITE_URL") || "https://kpe-formation-site.netlify.app";

    const preview =
      messagePreview && messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview || "";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KPE Formation <noreply@ikonik-ac.com>",
        to: [ADMIN_EMAIL],
        subject: `Nouveau message de ${studentName || "un eleve"} - KPE`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; font-size: 20px;">Nouveau message d'un eleve</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              <strong>${studentName || "Un eleve"}</strong> vous a envoye un message dans l'espace formation KPE.
            </p>
            ${
              preview
                ? `<div style="background: #f9fafb; border-left: 3px solid #c8a44e; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">"${preview}"</p>
              </div>`
                : ""
            }
            <div style="text-align: center; margin: 30px 0;">
              <a href="${SITE_URL}/admin/"
                 style="background-color: #025159; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                Repondre dans le dashboard
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
              KPE Formation - Kinesiologie Professionnelle et Energetique
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
  path: "/api/notify-admin-message",
};
