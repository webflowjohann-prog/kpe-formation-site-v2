import type { APIRoute } from 'astro'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase'

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe()
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET as string

  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook signature failed: ${msg}`, { status: 400 })
  }

  const supabase = createAdminSupabase()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const memberId = session.metadata?.member_id
      if (!memberId) break

      if (session.mode === 'subscription') {
        // Mettre à jour le plan du membre
        const plan = session.metadata?.plan
        if (plan) {
          await supabase.from('members').update({ plan }).eq('id', memberId)
        }
      }

      if (session.mode === 'payment') {
        // Marquer la commande comme payée
        await supabase
          .from('partner_orders')
          .update({ status: 'paid' })
          .eq('stripe_session_id', session.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const customerId = sub.customer as string
      // Retrouver le membre via customer ID (si on stocke le customer_id)
      // Pour Sprint 4, log seulement
      console.info('[webhook] subscription.deleted', customerId)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object
      console.info('[webhook] invoice.paid', invoice.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
