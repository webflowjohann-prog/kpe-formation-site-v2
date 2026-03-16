import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
});

const SITE_URL = Netlify.env.get("SITE_URL") || "https://kpe-formation-site.netlify.app";

// Price IDs from Stripe Dashboard
const PRICES: Record<string, { one_time: string; installments?: string }> = {
  online: {
    one_time: Netlify.env.get("STRIPE_PRICE_ONLINE") || "",
    installments: Netlify.env.get("STRIPE_PRICE_ONLINE_3X") || "",
  },
  presentiel: {
    one_time: Netlify.env.get("STRIPE_PRICE_PRESENTIEL") || "",
  },
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { product_type = "online", payment_mode = "one_time" } = body;

    const priceConfig = PRICES[product_type];
    if (!priceConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid product type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const priceId =
      payment_mode === "installments" && priceConfig.installments
        ? priceConfig.installments
        : priceConfig.one_time;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price not configured" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/espace-eleve?inscription=success`,
      cancel_url: `${SITE_URL}/formation-en-ligne?cancelled=true`,
      metadata: {
        product_type,
        payment_mode,
      },
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/create-checkout",
};
