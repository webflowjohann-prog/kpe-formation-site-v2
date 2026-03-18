import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET = "email-images";

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export default async (req: Request, context: Context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 403,
      headers,
    });
  }

  // GET: list images in bucket
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }

    const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
    const images = (data || [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => ({
        name: f.name,
        url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${f.name}`,
        created_at: f.created_at,
      }));

    return new Response(JSON.stringify({ images }), { status: 200, headers });
  }

  // POST: upload image
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers,
        });
      }

      // Validate mime type
      const allowed = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
      ];
      if (!allowed.includes(file.type)) {
        return new Response(
          JSON.stringify({
            error: `Type ${file.type} non supporte. Utilisez PNG, JPEG, WebP ou GIF.`,
          }),
          { status: 400, headers }
        );
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "Image trop lourde (max 5 MB)" }),
          { status: 400, headers }
        );
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `img_${Date.now()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers,
        });
      }

      const SUPABASE_URL = Netlify.env.get("SUPABASE_URL") || "";
      const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

      return new Response(JSON.stringify({ url, name: fileName }), {
        status: 200,
        headers,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};

export const config: Config = {
  path: "/api/upload-image",
};
