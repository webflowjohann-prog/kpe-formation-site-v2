import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'
import { getStripe, PLANS } from '@/lib/stripe'

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { plan?: string; products?: Array<{ product_id: string; quantity: number }> }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const stripe = getStripe()
  const siteUrl = import.meta.env.PUBLIC_SITE_URL as string

  // ── Mode abonnement ───────────────────────────────────────────────────────
  if (body.plan) {
    const planConfig = PLANS[body.plan]
    if (!planConfig?.priceId) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${siteUrl}/app?checkout=success&plan=${body.plan}`,
      cancel_url: `${siteUrl}/app/profile?checkout=cancelled`,
      metadata: { member_id: user.id, plan: body.plan },
    })

    return new Response(JSON.stringify({ checkout_url: session.url }), { status: 200 })
  }

  // ── Mode produits (marketplace) ──────────────────────────────────────────
  if (body.products && body.products.length > 0) {
    const productIds = body.products.map((p) => p.product_id)

    const { data: dbProducts } = await supabase
      .from('partner_products')
      .select('id, name, price_cents, stripe_price_id, partner_id, image_url')
      .in('id', productIds)
      .eq('active', true)

    if (!dbProducts || dbProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'Products not found' }), { status: 404 })
    }

    const lineItems = body.products.flatMap((item) => {
      const product = dbProducts.find((p) => p.id === item.product_id)
      if (!product) return []

      // Si un stripe_price_id existe, l'utiliser
      if (product.stripe_price_id) {
        return [{ price: product.stripe_price_id, quantity: item.quantity }]
      }

      // Sinon créer un prix inline
      return [{
        price_data: {
          currency: 'eur',
          unit_amount: product.price_cents,
          product_data: { name: product.name },
        },
        quantity: item.quantity,
      }]
    })

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid items' }), { status: 400 })
    }

    const totalCents = body.products.reduce((sum, item) => {
      const p = dbProducts.find((d) => d.id === item.product_id)
      return sum + (p?.price_cents ?? 0) * item.quantity
    }, 0)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: lineItems as Parameters<typeof stripe.checkout.sessions.create>[0]['line_items'],
      success_url: `${siteUrl}/app/marketplace?checkout=success`,
      cancel_url: `${siteUrl}/app/marketplace?checkout=cancelled`,
      metadata: { member_id: user.id },
    })

    // Créer la commande en base
    await supabase.from('partner_orders').insert({
      member_id: user.id,
      stripe_session_id: session.id,
      status: 'pending',
      total_cents: totalCents,
      items: body.products,
    })

    return new Response(JSON.stringify({ checkout_url: session.url }), { status: 200 })
  }

  return new Response(JSON.stringify({ error: 'Missing plan or products' }), { status: 400 })
}
