import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Netlify.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-12-18.acacia",
});

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify admin auth
async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export default async (req: Request, context: Context) => {
  // Only POST for creating, GET for listing
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify admin
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Non autorise" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET: List existing promotion codes
  if (req.method === "GET") {
    try {
      const promoCodes = await stripe.promotionCodes.list({ limit: 100, active: true });
      const codes = promoCodes.data.map((pc) => ({
        id: pc.id,
        code: pc.code,
        discount: pc.coupon.percent_off
          ? `${pc.coupon.percent_off}%`
          : pc.coupon.amount_off
          ? `${pc.coupon.amount_off / 100}\u20ac`
          : "?",
        percent_off: pc.coupon.percent_off,
        amount_off: pc.coupon.amount_off,
        active: pc.active,
        times_redeemed: pc.times_redeemed,
        max_redemptions: pc.max_redemptions,
        created: new Date(pc.created * 1000).toISOString(),
        expires_at: pc.expires_at
          ? new Date(pc.expires_at * 1000).toISOString()
          : null,
      }));
      return new Response(JSON.stringify({ codes }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Error listing promo codes:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST: Create promotion codes
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { discount, quantity } = body;

      if (!discount || !quantity || quantity < 1 || quantity > 500) {
        return new Response(
          JSON.stringify({ error: "Parametres invalides" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create a Stripe Coupon first
      const couponParams: Stripe.CouponCreateParams = {
        name: `KPE -${discount}%`,
        duration: "forever",
      };

      if (discount === 100) {
        couponParams.percent_off = 100;
      } else {
        couponParams.percent_off = discount;
      }

      const coupon = await stripe.coupons.create(couponParams);
      console.log(`Coupon created: ${coupon.id} (${discount}% off)`);

      // Generate promotion codes
      const generatedCodes: string[] = [];
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

      for (let i = 0; i < quantity; i++) {
        let code = "KPE-";
        for (let j = 0; j < 6; j++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }

        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: code,
          max_redemptions: 1,
        });

        generatedCodes.push(promoCode.code);
      }

      console.log(
        `${quantity} promo codes created with ${discount}% discount`
      );

      return new Response(
        JSON.stringify({
          success: true,
          coupon_id: coupon.id,
          codes: generatedCodes,
          discount: `${discount}%`,
          quantity: generatedCodes.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error("Error creating promo codes:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("OK", { status: 200 });
};

export const config: Config = {
  path: "/api/promo-codes",
};
