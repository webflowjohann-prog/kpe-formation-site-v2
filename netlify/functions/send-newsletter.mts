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

  // GET: return list of students + podia contacts
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

    const { data: podiaContacts } = await supabaseAdmin
      .from("podia_contacts")
      .select("id, name, email, subscribed, spent, source");

    return new Response(JSON.stringify({ students: enriched, podiaContacts: podiaContacts || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST: send newsletter
  try {
    const { subject, htmlContent, recipients } = await req.json();
    const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey || !subject || !htmlContent || !recipients?.length) {
      return new Response(
        JSON.stringify({ error: "Parametres manquants" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails in batches of 10 to avoid rate limits
    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10);

      const promises = batch.map(async (r: { email: string; name: string }) => {
        try {
          const personalizedHtml = htmlContent
            .replace(/\{\{name\}\}/g, r.name || "")
            .replace(/\{\{email\}\}/g, r.email);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "KPE Formation <noreply@ikonik-ac.com>",
              to: [r.email],
              subject: subject,
              html: personalizedHtml,
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            failed++;
            const err = await res.text();
            errors.push(`${r.email}: ${err}`);
          }
        } catch (e: any) {
          failed++;
          errors.push(`${r.email}: ${e.message}`);
        }
      });

      await Promise.all(promises);

      // Small delay between batches
      if (i + 10 < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
