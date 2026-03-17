import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
});

const endpointSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SITE_URL =
  Netlify.env.get("SITE_URL") || "https://kpe-formation-site.netlify.app";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail =
        session.customer_details?.email || session.customer_email;
      const customerName = session.customer_details?.name || null;
      const productType = session.metadata?.product_type || "online";
      const amountTotal = session.amount_total || 0;

      if (!customerEmail) {
        console.error("No customer email found");
        return new Response("No email", { status: 400 });
      }

      console.log(`Processing payment for: ${customerEmail} (${amountTotal / 100}€)`);

      // Check if user already exists in Supabase Auth
      const { data: existingUsers } =
        await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === customerEmail
      );

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        console.log(`User already exists: ${userId}`);
      } else {
        // Create new user with temporary password
        const tempPassword =
          "KPE-" +
          Math.random().toString(36).substring(2, 8).toUpperCase() +
          "!" +
          Math.floor(Math.random() * 100);

        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: customerName || "",
              product_type: productType,
            },
          });

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response("Error creating user", { status: 500 });
        }

        userId = newUser.user.id;
        console.log(`New user created: ${userId}`);

        // Create profile in profiles table
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            email: customerEmail,
            full_name: customerName || "",
            role: "student",
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      // Create enrollment with correct column names
      const { error: enrollError } = await supabaseAdmin
        .from("enrollments")
        .upsert(
          {
            user_id: userId,
            product_type: productType,
            status: "active",
            amount_paid: amountTotal,
            stripe_session_id: session.id,
          },
          { onConflict: "user_id" }
        );

      if (enrollError) {
        console.error("Error creating enrollment:", enrollError);
      } else {
        console.log(`Enrollment created for ${customerEmail}`);
      }

      // Send password reset email so user can set their password
      // This works even for newly created users with email_confirm: true
      if (!existingUser) {
        const resetResponse = await fetch(
          `${Netlify.env.get("SUPABASE_URL")}/auth/v1/recover`,
          {
            method: "POST",
            headers: {
              apikey: Netlify.env.get("SUPABASE_ANON_KEY") || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: customerEmail }),
          }
        );

        if (resetResponse.ok) {
          console.log(`Password reset email sent to ${customerEmail}`);
        } else {
          console.error(
            "Error sending password reset:",
            await resetResponse.text()
          );
        }
      }

      return new Response(JSON.stringify({ received: true, userId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return new Response(`Processing Error: ${err.message}`, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/stripe-webhook",
};
