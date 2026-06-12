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
      let userPassword = "";

      if (existingUser) {
        userId = existingUser.id;
        console.log(`User already exists: ${userId}`);
      } else {
        // Create new user with unique permanent password
        userPassword =
          "KPE-" +
          Math.random().toString(36).substring(2, 8).toUpperCase() +
          "!" +
          Math.floor(Math.random() * 100);

        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: userPassword,
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

      // Send welcome email with login credentials via Resend API
      if (!existingUser && userPassword) {
        try {
          const resendApiKey = Netlify.env.get("RESEND_API_KEY") || "";

          if (resendApiKey) {
            const loginUrl = `${SITE_URL}/espace-eleve/`;

            const emailResponse = await fetch(
              "https://api.resend.com/emails",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "KPE Formation <noreply@ikonik-ac.com>",
                  to: [customerEmail],
                  subject:
                    "Bienvenue sur KPE Formation \u2013 Vos identifiants de connexion",
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1a1a1a; font-size: 24px;">Bienvenue sur KPE Formation !</h1>
                      </div>
                      <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Bonjour${customerName ? ` ${customerName}` : ""},
                      </p>
                      <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Merci pour votre inscription ! Votre paiement de <strong>${amountTotal / 100} \u20ac</strong> a bien \u00e9t\u00e9 re\u00e7u.
                      </p>
                      <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Voici vos identifiants pour acc\u00e9der \u00e0 votre espace \u00e9l\u00e8ve :
                      </p>
                      <div style="background-color: #f8f6f1; border: 1px solid #e8e4db; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="color: #333; font-size: 15px; margin: 8px 0;">
                          <strong>Email :</strong> ${customerEmail}
                        </p>
                        <p style="color: #333; font-size: 15px; margin: 8px 0;">
                          <strong>Mot de passe :</strong>
                          <span style="font-family: monospace; background-color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 16px; letter-spacing: 1px; border: 1px solid #ddd;">
                            ${userPassword}
                          </span>
                        </p>
                      </div>
                      <p style="color: #333; font-size: 14px; line-height: 1.6;">
                        Conservez bien cet email, il contient vos identifiants de connexion.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}"
                           style="background-color: #c8a44e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                          Acc\u00e9der \u00e0 mon espace
                        </a>
                      </div>
                      <p style="color: #666; font-size: 14px; line-height: 1.6;">
                        Si vous avez des questions, contactez-nous \u00e0 l'adresse formation.kpe@gmail.com
                      </p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                      <p style="color: #999; font-size: 12px; text-align: center;">
                        KPE Formation \u2013 Kin\u00e9siologie Professionnelle et \u00c9nerg\u00e9tique
                      </p>
                    </div>
                  `,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log(`Welcome email with credentials sent to ${customerEmail}`);

                // Notify admin (Joël) of new enrollment
                try {
                  await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${resendApiKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      from: "KPE Formation <noreply@ikonik-ac.com>",
                      to: ["joel.prieur@gmail.com"],
                      subject: `Nouvelle inscription KPE : ${customerName || customerEmail}`,
                      html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                          <h2 style="color: #0d4f4f;">\ud83c\udf89 Nouvel \u00e9l\u00e8ve inscrit !</h2>
                          <p><strong>Nom :</strong> ${customerName || "Non renseign\u00e9"}</p>
                          <p><strong>Email :</strong> ${customerEmail}</p>
                          <p><strong>Montant :</strong> ${amountTotal / 100} \u20ac</p>
                          <p><strong>Date :</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
                          <p style="margin-top: 20px;"><a href="https://kpe-formation-site.netlify.app/admin" style="background: #0d4f4f; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Voir le dashboard</a></p>
                        </div>
                      `,
                    }),
                  });
                  console.log("Admin notification sent to joel.prieur@gmail.com");
                } catch (notifErr) {
                  console.error("Admin notification error:", notifErr);
                }
            } else {
              const errText = await emailResponse.text();
              console.error("Error sending email via Resend:", errText);
            }
          } else {
            console.error("RESEND_API_KEY not configured");
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
