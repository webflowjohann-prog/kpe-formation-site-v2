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

      console.log(
        `Processing payment for: ${customerEmail} (${amountTotal / 100}EUR)`
      );

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
      }

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

      // Create enrollment
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

      // Send welcome email directly via Resend API
      if (!existingUser) {
        try {
          // Generate recovery link via Supabase Admin
          const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email: customerEmail,
              options: {
                redirectTo: `${SITE_URL}/espace-eleve/`,
              },
            });

          if (linkError) {
            console.error("Error generating recovery link:", linkError);
          } else {
            const recoveryLink = linkData?.properties?.action_link || "";
            console.log(`Recovery link generated for ${customerEmail}`);

            // Send email via Resend API directly
            const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";

            if (resendApiKey) {
              const emailResponse = await fetch(
                "https://api.resend.com/emails",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "KPE Formation <onboarding@resend.dev>",
                    to: [customerEmail],
                    subject:
                      "Bienvenue sur KPE Formation - Activez votre compte",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h1 style="color: #1a1a1a; font-size: 24px;">Bienvenue sur KPE Formation !</h1>
                        </div>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                          Bonjour${customerName ? ` ${customerName}` : ""},
                        </p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                          Merci pour votre inscription ! Votre paiement de <strong>${amountTotal / 100} EUR</strong> a bien ete recu.
                        </p>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                          Pour acceder a votre espace eleve, cliquez sur le bouton ci-dessous pour definir votre mot de passe :
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${recoveryLink}"
                             style="background-color: #c8a44e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Activer mon compte
                          </a>
                        </div>
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                          Ce lien est valable 24 heures. Si vous avez des questions, contactez-nous a l'adresse formation.kpe@gmail.com
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="color: #999; font-size: 12px; text-align: center;">
                          KPE Formation - Kinesiologie Professionnelle et Energetique
                        </p>
                      </div>
                    `,
                  }),
                }
              );

              if (emailResponse.ok) {
                console.log(`Welcome email sent to ${customerEmail}`);
              } else {
                const errText = await emailResponse.text();
                console.error("Error sending email via Resend:", errText);
              }
            } else {
              console.error("RESEND_API_KEY not configured");
            }
          }
        } catch (emailErr) {
          console.error("Error in email sending process:", emailErr);
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
