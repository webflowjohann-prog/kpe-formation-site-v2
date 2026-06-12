import { useState } from 'react'
import { useStore } from '@nanostores/react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'
import { $cart, addToCart, cartTotal } from '@/stores/cart'

const AGENT: AgentId = 'fuel'

interface Supplement {
  id: string
  title: string
  description: string | null
  timing: string | null
  duration: string | null
  priority: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price_cents: number
  category: string
  agent_tags: string[] | null
  dosage: string | null
  image_url: string | null
  featured: boolean
  partners: { name: string } | null
}

interface Props {
  memberId: string
  supplements: Supplement[]
  products: Product[]
}

const TABS = ['Chat', 'Suppléments', 'Boutique'] as const
type Tab = (typeof TABS)[number]

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function MiniProductCard({ product }: { product: Product }) {
  const cart = useStore($cart)
  const inCart = cart.find((i) => i.productId === product.id)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addToCart({
      productId: product.id,
      name: product.name,
      price_cents: product.price_cents,
      quantity: 1,
      partner_name: product.partners?.name,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="glass p-4 flex flex-col gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-sans text-sm font-medium text-t1 leading-snug">{product.name}</p>
          {product.featured && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 font-sans text-[8px] text-gold">FUEL</span>
          )}
        </div>
        {product.partners && (
          <p className="font-sans text-[10px] text-t4">{product.partners.name}</p>
        )}
        {product.description && (
          <p className="font-sans text-[11px] text-t3 leading-relaxed mt-1 line-clamp-2">{product.description}</p>
        )}
        {product.dosage && (
          <p className="font-sans text-[10px] text-t4 mt-0.5">{product.dosage}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-serif text-lg text-gold">{fmt(product.price_cents)}</span>
        <button
          onClick={handleAdd}
          className={[
            'flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans text-[10px] font-medium transition-all',
            added || inCart
              ? 'bg-gold/15 border border-gold/30 text-gold'
              : 'bg-surface border border-border text-t2 hover:border-gold/25 hover:text-t1',
          ].join(' ')}
        >
          {added ? 'Ajouté' : inCart ? 'Dans le panier' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

function SupplementsTab({ supplements }: { supplements: Supplement[] }) {
  if (supplements.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold/08 border border-gold/15 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-gold opacity-60">
            <path d="M8 4h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-sans text-sm text-t3 leading-relaxed mb-2">
          Aucun supplément prescrit pour l'instant.
        </p>
        <p className="font-sans text-xs text-t4 leading-relaxed">
          Parlez à FUEL dans l'onglet Chat pour recevoir vos premières prescriptions.
        </p>
      </div>
    )
  }

  const PRIORITY_LABEL: Record<string, string> = {
    high: 'Prioritaire',
    medium: 'Recommandé',
    low: 'Optionnel',
  }
  const PRIORITY_COLOR: Record<string, string> = {
    high: 'text-gold border-gold/30 bg-gold/08',
    medium: 'text-t2 border-white/15 bg-white/04',
    low: 'text-t4 border-white/08 bg-transparent',
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {supplements.map((s) => (
        <div key={s.id} className="glass p-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-sans text-sm font-medium text-t1">{s.title}</span>
            <span className={`label border rounded-full px-2.5 py-0.5 ${PRIORITY_COLOR[s.priority] ?? PRIORITY_COLOR.medium}`}>
              {PRIORITY_LABEL[s.priority] ?? 'Recommandé'}
            </span>
          </div>
          {s.description && (
            <p className="font-sans text-xs text-t3 leading-relaxed mb-3">{s.description}</p>
          )}
          <div className="flex gap-4">
            {s.timing && (
              <span className="font-sans text-[10px] text-t4 flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M5 3v2l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {s.timing}
              </span>
            )}
            {s.duration && (
              <span className="font-sans text-[10px] text-t4">{s.duration}</span>
            )}
          </div>
        </div>
      ))}
      <a
        href="/app/marketplace"
        className="btn-outline w-full flex items-center justify-center gap-2 h-11 mt-2"
      >
        Commander dans la boutique
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  )
}

function BoutiqueTab({ products }: { products: Product[] }) {
  const cart = useStore($cart)
  const total = cartTotal(cart)

  if (products.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="font-sans text-sm text-t3 mb-2">Aucun produit disponible.</p>
        <a href="/app/marketplace" className="btn-gold h-10 px-5 inline-flex items-center text-[10px]">
          Voir tout le catalogue
        </a>
      </div>
    )
  }

  const featured = products.filter((p) => p.featured)
  const regular = products.filter((p) => !p.featured)

  return (
    <div className="px-5 py-4">
      <p className="font-sans text-xs text-t3 mb-4 leading-relaxed">
        Suppléments sélectionnés par FUEL selon votre profil nutritionnel et vos carences identifiées.
      </p>

      {cart.length > 0 && (
        <div className="glass p-4 flex items-center justify-between mb-4">
          <div>
            <p className="font-sans text-xs text-t3">{cart.length} article{cart.length > 1 ? 's' : ''}</p>
            <p className="font-serif text-lg text-gold">{fmt(total)}</p>
          </div>
          <a href="/app/marketplace/cart" className="btn-gold h-9 px-4 text-[9px] inline-flex items-center">
            Passer commande
          </a>
        </div>
      )}

      {featured.length > 0 && (
        <div className="mb-4">
          <span className="label text-gold block mb-3">Recommandés</span>
          <div className="flex flex-col gap-3">
            {featured.map((p) => <MiniProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {regular.length > 0 && (
        <div className="mb-4">
          {featured.length > 0 && <span className="label block mb-3">Catalogue FUEL</span>}
          <div className="grid grid-cols-2 gap-3">
            {regular.map((p) => <MiniProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      <a
        href="/app/marketplace"
        className="btn-outline w-full flex items-center justify-center gap-2 h-10 text-[10px]"
      >
        Voir tout le catalogue
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </div>
  )
}

export default function FuelDashboard({ memberId, supplements, products }: Props) {
  const [tab, setTab] = useState<Tab>('Chat')

  return (
    <div>
      <div className="flex gap-0 border-b border-sep px-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-3 font-sans text-xs transition-all border-b-2 -mb-px',
              tab === t
                ? 'text-t1 font-bold border-gold'
                : 'text-t3 font-medium border-transparent hover:text-t2',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Suppléments' && <SupplementsTab supplements={supplements} />}
      {tab === 'Boutique' && <BoutiqueTab products={products} />}
    </div>
  )
}
