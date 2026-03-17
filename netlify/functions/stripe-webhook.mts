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

  // Verify webhook signature
  try {
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } else {
      // In test mode without webhook secret, parse directly
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle checkout.session.completed
  if (
    event.type === "checkout.session.completed" ||
    event.type === "invoice.payment_succeeded"
  ) {
    try {
      let customerEmail: string | null = null;
      let customerName: string | null = null;
      let productType = "online";
      let paymentMode = "one_time";

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        customerEmail = session.customer_details?.email || session.customer_email;
        customerName = session.customer_details?.name || null;
        productType = session.metadata?.product_type || "online";
        paymentMode = session.metadata?.payment_mode || "one_time";
      }

      if (!customerEmail) {
        console.error("No customer email found in webhook event");
        return new Response("No email", { status: 400 });
      }

      console.log(`Processing payment for: ${customerEmail}`);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === customerEmail
      );

      let userId: string;

      if (existingUser) {
        // User already exists, just update enrollment
        userId = existingUser.id;
        console.log(`User already exists: ${userId}`);
      } else {
        // Create new user with Supabase Auth
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

        // Create profile
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

      // Create or update enrollment
      const { error: enrollError } = await supabaseAdmin
        .from("enrollments")
        .upsert(
          {
            user_id: userId,
            product_type: productType,
            payment_mode: paymentMode,
            status: "active",
            enrolled_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (enrollError) {
        console.error("Error creating enrollment:", enrollError);
      }

      // Send invite email so user can set their password
      if (!existingUser) {
        const { data: linkData, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(customerEmail, {
            redirectTo: `${SITE_URL}/espace-eleve`,
          });

        if (inviteError) {
          console.error("Error sending invite:", inviteError);
        } else {
          console.log(`Invite email sent to ${customerEmail}`);
        }
      }

      console.log(
        `Enrollment created for ${customerEmail} (${productType}, ${paymentMode})`
      );

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return new Response(`Processing Error: ${err.message}`, { status: 500 });
    }
  }

  // Acknowledge other events
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/stripe-webhook",
};
