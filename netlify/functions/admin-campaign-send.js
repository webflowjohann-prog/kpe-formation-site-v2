/**
 * POST /api/admin-campaign-send
 *
 * Envoie une campagne email à un groupe de leads via Resend.
 * Crée 1 ligne email_sends par destinataire pour tracking.
 *
 * Body JSON :
 *   {
 *     campaign_id: "uuid",       // (optionnel) si déjà créée
 *     OR
 *     name: "Campagne mai 2026",
 *     subject: "Découvrez la KPE",
 *     body_html: "<html>...",
 *     body_text: "version texte...",
 *     from_name: "Joël Prieur",
 *     from_email: "contact@formation-kinesiologie.com",
 *     audience: {
 *       source: "meta_ads",       // filtre
 *       subscribed: true,
 *       status: "new",
 *       tag_ids: ["uuid"],
 *       limit: 100                // pour test, limiter à N destinataires
 *     },
 *     test_mode: false,           // si true, n'envoie qu'à test_emails
 *     test_emails: ["..."]
 *   }
 *
 * Réponse :
 *   {
 *     ok: true,
 *     campaign_id: "uuid",
 *     queued: 156,
 *     sent: 0,                    // sera 156 après traitement
 *     status: "sending"
 *   }
 *
 * NOTE : pour un MVP, l'envoi se fait SYNCHRONE en boucle.
 * Pour > 100 destinataires, prévoir une queue async (à venir v2).
 */
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const RATE_LIMIT_MS = 100; // Resend = 10 emails/sec max sur le plan gratuit

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function applyVariables(template, lead) {
  // Remplace {{first_name}}, {{full_name}}, {{email}}, etc.
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, lead.first_name || "")
    .replace(/\{\{\s*last_name\s*\}\}/gi, lead.last_name || "")
    .replace(/\{\{\s*full_name\s*\}\}/gi, lead.full_name || lead.first_name || "")
    .replace(/\{\{\s*email\s*\}\}/gi, lead.email || "");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server config error" }) };
  }

  // Auth admin
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: isAdmin } = await userClient.rpc("is_admin");
  if (!isAdmin) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  // --- 1. Créer (ou récupérer) la campagne ---
  let campaign;
  if (body.campaign_id) {
    const { data } = await admin
      .from("email_campaigns")
      .select("*")
      .eq("id", body.campaign_id)
      .single();
    campaign = data;
  } else {
    const { data, error } = await admin
      .from("email_campaigns")
      .insert([
        {
          name: body.name || `Campagne ${new Date().toISOString().slice(0, 10)}`,
          subject: body.subject,
          preheader: body.preheader || null,
          body_html: body.body_html,
          body_text: body.body_text || null,
          from_name: body.from_name || "Joël Prieur",
          from_email: body.from_email || "contact@formation-kinesiologie.com",
          reply_to: body.reply_to || null,
          status: "sending",
          audience_query: body.audience || {},
        },
      ])
      .select()
      .single();
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    campaign = data;
  }

  if (!campaign) {
    return { statusCode: 400, body: JSON.stringify({ error: "Campagne introuvable" }) };
  }

  // --- 2. Sélectionner l'audience ---
  let leads = [];
  if (body.test_mode && Array.isArray(body.test_emails)) {
    // Mode test : créer des "leads" fake pour les emails de test
    leads = body.test_emails.map((email) => ({
      id: null,
      email,
      first_name: "Test",
      full_name: "Test",
    }));
  } else {
    let query = admin
      .from("leads")
      .select("id, email, first_name, last_name, full_name")
      .eq("subscribed", true);

    const audience = body.audience || campaign.audience_query || {};
    if (audience.source) query = query.eq("source", audience.source);
    if (audience.status) query = query.eq("status", audience.status);
    if (Array.isArray(audience.tag_ids) && audience.tag_ids.length > 0) {
      // Filtre par tags = sous-requête sur lead_tag_links
      const { data: linksData } = await admin
        .from("lead_tag_links")
        .select("lead_id")
        .in("tag_id", audience.tag_ids);
      const leadIds = [...new Set((linksData || []).map((l) => l.lead_id))];
      if (leadIds.length === 0) {
        leads = [];
      } else {
        query = query.in("id", leadIds);
      }
    }
    if (leads.length !== 0) {
      if (audience.limit) query = query.limit(audience.limit);
      const { data } = await query;
      leads = data || [];
    }
  }

  if (leads.length === 0) {
    await admin
      .from("email_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString(), audience_count: 0 })
      .eq("id", campaign.id);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, campaign_id: campaign.id, queued: 0, sent: 0 }),
    };
  }

  // --- 3. Créer les lignes email_sends ---
  const sendRows = leads.map((l) => ({
    campaign_id: campaign.id,
    lead_id: l.id,
    to_email: l.email,
    to_name: l.full_name || l.first_name || null,
    status: "queued",
  }));
  const { data: created } = await admin
    .from("email_sends")
    .insert(sendRows)
    .select("id, lead_id, to_email, to_name");

  // --- 4. Envoyer via Resend ---
  let sentCount = 0;
  let failedCount = 0;
  const fromAddr = `${campaign.from_name} <${campaign.from_email}>`;

  for (let i = 0; i < (created || []).length; i++) {
    const send = created[i];
    const lead = leads.find((l) => l.email === send.to_email) || {};

    const personalizedHtml = applyVariables(campaign.body_html, lead);
    const personalizedText = campaign.body_text
      ? applyVariables(campaign.body_text, lead)
      : null;
    const personalizedSubject = applyVariables(campaign.subject, lead);

    try {
      const { data: resp, error: respErr } = await resend.emails.send({
        from: fromAddr,
        to: [send.to_email],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText || undefined,
        reply_to: campaign.reply_to || undefined,
        headers: {
          "X-Campaign-ID": campaign.id,
          "X-Send-ID": send.id,
        },
      });
      if (respErr) throw respErr;
      await admin
        .from("email_sends")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_email_id: resp?.id || null,
        })
        .eq("id", send.id);
      sentCount++;
    } catch (e) {
      failedCount++;
      await admin
        .from("email_sends")
        .update({
          status: "failed",
          error_message: String(e.message || e).slice(0, 500),
        })
        .eq("id", send.id);
    }

    // Rate limit
    if (i < created.length - 1) await sleep(RATE_LIMIT_MS);
  }

  // --- 5. Mettre à jour la campagne ---
  await admin
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      audience_count: leads.length,
      total_sent: sentCount,
    })
    .eq("id", campaign.id);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      campaign_id: campaign.id,
      audience_size: leads.length,
      sent: sentCount,
      failed: failedCount,
    }),
  };
};
