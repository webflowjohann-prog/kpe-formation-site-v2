/**
 * POST /api/admin-leads-import-csv
 *
 * Import en masse de leads depuis un CSV (uploadé en base64 ou en texte).
 * Auto-detect le séparateur, dédoublonne par email, tag automatiquement.
 *
 * Body JSON :
 *   {
 *     csv: "Créé,Nom,Adresse e-mail,...\n...",  // texte CSV brut
 *     source: "meta_ads",                       // source à attribuer
 *     tagNames: ["Meta Ads", "À évaluer"],      // tags à appliquer (auto-créés)
 *     mapping: {                                // mapping colonnes optionnel
 *       email: "Adresse e-mail",
 *       name: "Nom",
 *       phone: "Téléphone",
 *       created_at: "Créé"
 *     }
 *   }
 *
 * Réponse :
 *   {
 *     ok: true,
 *     imported: 156,
 *     updated: 23,
 *     skipped: 0,
 *     failed: 0,
 *     errors: [...]
 *   }
 */
const { createClient } = require("@supabase/supabase-js");

// Mapping par défaut adapté au format CSV de Meta
const DEFAULT_MAPPING = {
  email: "Adresse e-mail",
  name: "Nom",
  phone: "Téléphone",
  whatsapp: "Numéro WhatsApp",
  created_at: "Créé",
  form_name: "Formulaire",
};

function parseCSV(text) {
  // Retirer BOM si présent
  text = text.replace(/^\uFEFF/, "");

  // Détecter séparateur : compter virgules vs points-virgules sur la 1re ligne
  const firstLine = text.split("\n")[0] || "";
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
    ? ";"
    : ",";

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parser une ligne CSV en gérant les guillemets
  const parseLine = (line) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === sep && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] || "").trim()]));
  });

  return { headers, rows };
}

function parseDate(s) {
  if (!s) return null;
  // Format "05/16/2026 4:56am"
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (m) {
    let [, mo, d, y, h, mi, ampm] = m;
    h = parseInt(h);
    if (ampm && ampm.toLowerCase() === "pm" && h < 12) h += 12;
    if (ampm && ampm.toLowerCase() === "am" && h === 12) h = 0;
    return new Date(Date.UTC(parseInt(y), parseInt(mo) - 1, parseInt(d), h, parseInt(mi))).toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function splitName(full) {
  if (!full || !full.trim()) return [null, null];
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], null];
  return [parts[0], parts.slice(1).join(" ")];
}

function normalizePhone(s) {
  if (!s) return null;
  const cleaned = String(s).replace(/[^\d+]/g, "");
  return cleaned || null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
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

  // Body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  if (!body.csv || typeof body.csv !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing 'csv' field" }) };
  }

  const source = body.source || "csv_upload";
  const tagNames = Array.isArray(body.tagNames) ? body.tagNames : [];
  const mapping = { ...DEFAULT_MAPPING, ...(body.mapping || {}) };

  const { headers, rows } = parseCSV(body.csv);
  if (rows.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "CSV vide ou invalide" }) };
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Préparer les tags
  const tagIds = [];
  for (const tagName of tagNames) {
    let { data: tag } = await admin
      .from("lead_tags")
      .select("id")
      .eq("name", tagName)
      .maybeSingle();
    if (!tag) {
      const { data: created } = await admin
        .from("lead_tags")
        .insert([{ name: tagName }])
        .select("id")
        .single();
      tag = created;
    }
    if (tag) tagIds.push(tag.id);
  }

  // Construire les leads
  const leadsToUpsert = [];
  const errors = [];
  let skipped = 0;

  for (const [i, row] of rows.entries()) {
    const email = (row[mapping.email] || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      skipped++;
      continue;
    }
    const fullName = (row[mapping.name] || "").trim();
    const [firstName, lastName] = splitName(fullName);
    const phone = normalizePhone(row[mapping.phone]);
    const whatsapp = normalizePhone(row[mapping.whatsapp]);
    const createdAt = parseDate(row[mapping.created_at]);

    const lead = {
      email,
      full_name: fullName || null,
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp,
      source,
      source_details: {
        form_name: row[mapping.form_name] || null,
        imported_at: new Date().toISOString(),
        csv_row_number: i + 2, // +2 car ligne 1 = headers
      },
      status: "new",
      subscribed: true,
    };
    if (createdAt) lead.created_at = createdAt;
    leadsToUpsert.push(lead);
  }

  // Upsert en batch
  const { data: upserted, error: upsertErr } = await admin
    .from("leads")
    .upsert(leadsToUpsert, { onConflict: "email", ignoreDuplicates: false })
    .select("id, email");

  if (upsertErr) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: upsertErr.message }),
    };
  }

  // Lier les tags si on en a
  if (tagIds.length > 0 && upserted && upserted.length > 0) {
    const links = [];
    for (const lead of upserted) {
      for (const tagId of tagIds) {
        links.push({ lead_id: lead.id, tag_id: tagId });
      }
    }
    await admin.from("lead_tag_links").upsert(links, { ignoreDuplicates: true });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      imported: upserted?.length || 0,
      skipped,
      total_rows: rows.length,
      tags_applied: tagNames,
      errors,
    }),
  };
};
