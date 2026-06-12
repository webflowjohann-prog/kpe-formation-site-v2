/**
 * GET /api/admin-leads-list
 *
 * Liste les leads avec filtres optionnels et pagination.
 *
 * Query params :
 *   - search    : recherche email/nom (LIKE %...%)
 *   - source    : filtre par source ('meta_ads', 'website_form', etc.)
 *   - status    : filtre par statut
 *   - subscribed: 'true' / 'false'
 *   - tag       : ID du tag à filtrer
 *   - limit     : nombre de résultats (défaut 50, max 200)
 *   - offset    : pagination
 *
 * Réponse :
 *   { ok, leads: [...], total, limit, offset }
 *
 * Auth : nécessite un cookie d'admin Supabase (vérifié via is_admin RPC)
 */
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server config error" }) };
  }

  // Auth : vérifier que l'appelant est admin via son token
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  const userToken = authHeader.slice(7);

  // Client avec le token de l'utilisateur pour vérifier ses droits
  const userClient = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });

  // Vérification admin
  const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
  if (adminErr || !isAdmin) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // Client service_role pour la requête réelle (bypass RLS)
  const admin = createClient(supabaseUrl, serviceKey);

  const params = event.queryStringParameters || {};
  const limit = Math.min(parseInt(params.limit) || 50, 200);
  const offset = parseInt(params.offset) || 0;

  let query = admin
    .from("leads")
    .select("*, lead_tag_links(tag_id, lead_tags(id, name, color))", { count: "exact" })
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (params.search) {
    query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`);
  }
  if (params.source) query = query.eq("source", params.source);
  if (params.status) query = query.eq("status", params.status);
  if (params.subscribed === "true") query = query.eq("subscribed", true);
  if (params.subscribed === "false") query = query.eq("subscribed", false);

  const { data, error, count } = await query;
  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      leads: data,
      total: count,
      limit,
      offset,
    }),
  };
};
