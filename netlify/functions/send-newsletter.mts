import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SITE_URL = Netlify.env.get("SITE_URL") || "https://formation-kinesiologie.com";
const UNSUBSCRIBE_SECRET =
  Netlify.env.get("UNSUBSCRIBE_SECRET") ||
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

const SEND_INTERVAL_MS = 600;

function generateUnsubToken(leadId: string, email: string): string {
  const payload = { lead_id: leadId, email, ts: Date.now() };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(data)
    .digest("base64url")
    .slice(0, 32);
  return `${data}.${sig}`;
}

function buildFooterHtml(unsubUrl: string): string {
  return `
    <div style="margin-top:40px;padding:24px 20px;background:#fafaf7;border-radius:8px;text-align:center;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0 0 12px;">
        Vous recevez ce message car vous avez manifesté votre intérêt pour la formation 
        Kinésiologie Psycho-Énergétique de Joël Prieur via 
        <a href="${SITE_URL}" style="color:#0d4f4f;text-decoration:none;">formation-kinesiologie.com</a>.
      </p>
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0 0 16px;">
        <strong>Joël Prieur — KPE Formation</strong><br>
        2 rue Lamartine, 15290 Parlan, France<br>
        06 76 96 69 04 — contact@formation-kinesiologie.com
      </p>
      <p style="font-size:11px;color:#9ca3af;line-height:1.5;margin:0 0 12px;">
        Email expédié par IKONIK, prestataire technique de KPE Formation.<br>
        Pour toute question, répondez directement à ce mail (Joël Prieur).
      </p>
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0;">
        <a href="${unsubUrl}" style="color:#0d4f4f;text-decoration:underline;">Se désinscrire de ces emails</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}/mentions-legales" style="color:#0d4f4f;text-decoration:underline;">Mentions légales</a>
      </p>
    </div>
  `;
}

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
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET : liste élèves + podia
  if (req.method === "GET") {
    const { data: students } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role, is_blocked")
      .eq("role", "student")
      .eq("is_blocked", false);

    const { data: enrollments } = await supabaseAdmin
      .from("enrollments")
      .select("user_id, product_type");

    const enriched = (students || []).map(s => {
      const enr = (enrollments || []).find(e => e.user_id === s.id);
      return { ...s, product_type: enr?.product_type || "online" };
    });

    let allPodiaContacts: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page } = await supabaseAdmin
        .from("podia_contacts")
        .select("id, name, email, subscribed, spent, source")
        .range(from, from + pageSize - 1);
      if (!page || page.length === 0) break;
      allPodiaContacts = allPodiaContacts.concat(page);
      if (page.length < pageSize) break;
      from += pageSize;
    }

    return new Response(JSON.stringify({ students: enriched, podiaContacts: allPodiaContacts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST : envoi séquentiel (synchrone)
  // ⚠️ Cette fonction est appelée comme background : path /api/newsletter
  // mais le code envoie SEQUENTIELLEMENT pour respecter le rate limit Resend (2/s)
  // Pour 100+ mails, on dépasse les 10s. C'est OK car waitUntil() empêche le timeout.
  try {
    const { subject, htmlContent, recipients } = await req.json();
    const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey || !subject || !htmlContent || !recipients?.length) {
      return new Response(
        JSON.stringify({ error: "Parametres manquants" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer lead_id pour les tokens
    const emailToLeadId = new Map<string, string>();
    const emails = recipients.map((r: any) => r.email);
    const { data: leadsMatch } = await supabaseAdmin
      .from("leads")
      .select("id, email")
      .in("email", emails);
    (leadsMatch || []).forEach(l => emailToLeadId.set(l.email, l.id));

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // ENVOI SÉQUENTIEL (1 par 1, 600ms entre chaque)
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      try {
        const leadId = emailToLeadId.get(r.email) || `unknown_${r.email}`;
        const unsubToken = generateUnsubToken(leadId, r.email);
        const unsubUrl = `${SITE_URL}/desinscription/?token=${unsubToken}`;

        const personalizedHtml = htmlContent
          .replace(/\{\{name\}\}/g, r.name || "")
          .replace(/\{\{email\}\}/g, r.email) + buildFooterHtml(unsubUrl);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "KPE Formation - Joël Prieur <formation-kpe@ikonik-ac.com>",
            reply_to: "passion.kpe@gmail.com",
            to: [r.email],
            subject: subject,
            html: personalizedHtml,
            headers: {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          failed++;
          const err = await res.text();
          errors.push(`${r.email}: ${err.slice(0, 100)}`);
        }
      } catch (e: any) {
        failed++;
        errors.push(`${r.email}: ${e.message}`);
      }

      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, SEND_INTERVAL_MS));
      }
    }

    console.log(`Newsletter sent: ${sent} ok, ${failed} failed`);

    return new Response(
      JSON.stringify({ sent, failed, errors: errors.slice(0, 5) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/newsletter",
};
