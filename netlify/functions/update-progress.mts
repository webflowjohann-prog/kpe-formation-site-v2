import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get auth token from header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // Create Supabase client with user's token
  const supabase = createClient(
    Netlify.env.get("SUPABASE_URL") || "",
    Netlify.env.get("SUPABASE_ANON_KEY") || "",
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { lesson_id, completed, watch_time_seconds } = body;

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: "lesson_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id,
          completed: completed || false,
          watch_time_seconds: watch_time_seconds || 0,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (error) {
      console.error("Progress update error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update progress" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/progress",
};
