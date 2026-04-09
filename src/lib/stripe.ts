import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-03-31.basil',
    })
  }
  return _stripe
}

export const PLANS: Record<string, { priceId: string; name: string }> = {
  essential: { priceId: import.meta.env.STRIPE_PRICE_ESSENTIAL ?? '', name: 'Essential' },
  performance: { priceId: import.meta.env.STRIPE_PRICE_PERFORMANCE ?? '', name: 'Performance' },
  elite: { priceId: import.meta.env.STRIPE_PRICE_ELITE ?? '', name: 'Elite' },
}
