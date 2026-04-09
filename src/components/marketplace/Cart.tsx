import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $cart, removeFromCart, updateQty, clearCart, cartTotal } from '@/stores/cart'

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function Cart() {
  const cart = useStore($cart)
  const total = cartTotal(cart)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkout() {
    if (cart.length === 0 || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: cart.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la création du paiement')

      const data = await res.json()
      if (data.checkout_url) {
        clearCart()
        window.location.href = data.checkout_url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="text-t4">
            <path d="M3 3h2.5l3 13h12l2.5-9H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="11" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <p className="font-sans text-sm text-t3 mb-1">Votre panier est vide</p>
        <p className="font-sans text-xs text-t4 mb-6">Demandez à FUEL de vous prescrire des suppléments.</p>
        <a href="/app/marketplace" className="btn-outline h-10 px-5 text-[9px]">
          Voir la boutique
        </a>
      </div>
    )
  }

  return (
    <div className="px-5 py-4">
      {/* Items */}
      <div className="flex flex-col gap-3 mb-6">
        {cart.map((item) => (
          <div key={item.productId} className="glass p-4 flex items-center gap-4">
            {/* Quantity controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => updateQty(item.productId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-t3 hover:text-t1 hover:border-white/25 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="font-sans text-sm text-t1 w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.productId, item.quantity + 1)}
                className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-t3 hover:text-t1 hover:border-white/25 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-medium text-t1 truncate">{item.name}</p>
              {item.partner_name && (
                <p className="font-sans text-[10px] text-t4">{item.partner_name}</p>
              )}
            </div>

            {/* Price + remove */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-serif text-base text-gold">{fmt(item.price_cents * item.quantity)}</span>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="font-sans text-[9px] text-t4 hover:text-red-400 transition-colors"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="glass p-5 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-sans text-sm text-t3">Sous-total</span>
          <span className="font-sans text-sm text-t1">{fmt(total)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-sans text-xs text-t4">Livraison</span>
          <span className="font-sans text-xs text-t4">Calculée à l'étape suivante</span>
        </div>
        <div className="h-px bg-white/[0.06] mb-4" />
        <div className="flex justify-between items-center">
          <span className="font-sans text-sm font-medium text-t1">Total</span>
          <span className="font-serif text-xl text-gold">{fmt(total)}</span>
        </div>
      </div>

      {error && (
        <p className="font-sans text-xs text-red-400 text-center mb-3">{error}</p>
      )}

      <button
        onClick={checkout}
        disabled={loading}
        className="btn-gold w-full h-12 flex items-center justify-center gap-2 text-[10px] disabled:opacity-50"
      >
        {loading ? 'Redirection…' : 'Payer avec Stripe'}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <p className="font-sans text-[9px] text-t4 text-center mt-2">
        Paiement sécurisé SSL via Stripe
      </p>
    </div>
  )
}
