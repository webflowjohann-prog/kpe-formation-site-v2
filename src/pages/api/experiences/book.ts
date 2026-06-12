import type { APIRoute } from 'astro'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { experience_id?: string } = {}
  try { body = await request.json() } catch {}
  if (!body.experience_id) {
    return new Response(JSON.stringify({ error: 'experience_id required' }), { status: 400 })
  }

  const admin = createAdminSupabase()

  // Charger l'expérience
  const { data: exp, error: expErr } = await admin
    .from('experience_catalog')
    .select('id, title, price_cents, spots_remaining, min_oracle_score, status')
    .eq('id', body.experience_id)
    .single()

  if (expErr || !exp) {
    return new Response(JSON.stringify({ error: 'Experience not found' }), { status: 404 })
  }

  if (exp.status === 'full' || exp.spots_remaining <= 0) {
    return new Response(JSON.stringify({ error: 'Plus de places disponibles' }), { status: 409 })
  }

  // Vérifier le score ORACLE du membre
  const { data: member } = await admin
    .from('members')
    .select('cortex_score, full_name')
    .eq('id', user.id)
    .single()

  if ((member?.cortex_score ?? 0) < (exp.min_oracle_score ?? 0)) {
    return new Response(JSON.stringify({
      error: `Score ORACLE insuffisant. Minimum requis : ${exp.min_oracle_score}/100. Votre score : ${member?.cortex_score ?? 0}/100.`
    }), { status: 403 })
  }

  // Vérifier si déjà réservé
  const { data: existing } = await admin
    .from('experience_bookings')
    .select('id, status')
    .eq('member_id', user.id)
    .eq('experience_id', body.experience_id)
    .maybeSingle()

  if (existing && existing.status !== 'cancelled' && existing.status !== 'refunded') {
    return new Response(JSON.stringify({ error: 'Vous avez déjà réservé cette expérience' }), { status: 409 })
  }

  const stripe = getStripe()
  const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321'

  // Créer session Stripe
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: exp.price_cents,
        product_data: {
          name: exp.title,
          description: `Pré-réservation NATICS Lab — ${exp.title}`,
        },
      },
    }],
    metadata: {
      type: 'experience',
      experience_id: exp.id,
      member_id: user.id,
    },
    success_url: `${siteUrl}/app/agents/atlas?booking=success`,
    cancel_url: `${siteUrl}/app/agents/atlas?booking=cancel`,
  })

  // Upsert booking en pending
  await admin.from('experience_bookings').upsert({
    member_id: user.id,
    experience_id: body.experience_id,
    stripe_session_id: session.id,
    status: 'pending',
    amount_cents: exp.price_cents,
  }, { onConflict: 'member_id,experience_id' })

  return new Response(JSON.stringify({ checkout_url: session.url }), { status: 200 })
}
