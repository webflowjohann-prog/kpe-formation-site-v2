import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET") || "";

  if (!sig) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const customerId = session.customer as string;
    const paymentIntent = session.payment_intent as string;
    const amountTotal = session.amount_total;
    const productType = session.metadata?.product_type || "online";

    if (!customerEmail) {
      console.error("No customer email in session");
      return new Response("No email", { status: 400 });
    }

    console.log(`Processing enrollment for ${customerEmail} - ${productType}`);

    try {
      // Check if user already exists in Supabase auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === customerEmail
      );

      let userId: string;

      if (existingUser) {
        // User exists, just add enrollment
        userId = existingUser.id;
        console.log(`Existing user found: ${userId}`);
      } else {
        // Create new user with random password (they'll use magic link or reset)
        const tempPassword = crypto.randomUUID().slice(0, 16) + "Kp3!";

        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: customerName || "",
            },
          });

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response("Error creating user", { status: 500 });
        }

        userId = newUser.user.id;
        console.log(`New user created: ${userId}`);

        // Update profile with Stripe customer ID
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            full_name: customerName || "",
          })
          .eq("id", userId);
      }

      // Create enrollment
      const { error: enrollError } = await supabase
        .from("enrollments")
        .upsert(
          {
            user_id: userId,
            product_type: productType,
            stripe_payment_intent: paymentIntent,
            stripe_session_id: session.id,
            status: "active",
            amount_paid: amountTotal,
          },
          { onConflict: "user_id,product_type" }
        );

      if (enrollError) {
        console.error("Error creating enrollment:", enrollError);
      } else {
        console.log(`Enrollment created for ${customerEmail}`);
      }

      // Send password reset email so user can set their password
      if (!existingUser) {
        await supabase.auth.admin.generateLink({
          type: "recovery",
          email: customerEmail,
        });
        console.log(`Recovery link generated for ${customerEmail}`);
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
      return new Response("Internal error", { status: 500 });
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
