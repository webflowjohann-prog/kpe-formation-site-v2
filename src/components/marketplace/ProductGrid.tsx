import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $cart, addToCart, cartTotal } from '@/stores/cart'

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
  products: Product[]
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tous',
  supplement: 'Suppléments',
  food: 'Nutrition',
  equipment: 'Équipement',
}

const AGENT_COLORS: Record<string, string> = {
  fuel: 'bg-gold/10 text-gold border-gold/20',
  forge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  morphee: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  zenith: 'bg-green-500/10 text-green-400 border-green-500/20',
  oracle: 'bg-white/08 text-t3 border-white/12',
}

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function ProductCard({ product }: { product: Product }) {
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
    <div className="glass flex flex-col">
      {/* Image placeholder */}
      <div className="h-36 bg-white/[0.03] rounded-t-[20px] rounded-b-none flex items-center justify-center border-b border-white/[0.04]">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-t-[20px] rounded-b-none grayscale opacity-70" />
        ) : (
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-t4">
            <path d="M11 7h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M16 13v6M13 16h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Agent tags */}
        {product.agent_tags && product.agent_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.agent_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-full border font-sans text-[8px] uppercase tracking-[0.15em] ${AGENT_COLORS[tag] ?? AGENT_COLORS.oracle}`}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-sans text-sm font-medium text-t1 leading-snug mb-1">{product.name}</h3>
        {product.description && (
          <p className="font-sans text-[11px] text-t3 leading-relaxed mb-2 line-clamp-2">{product.description}</p>
        )}
        {product.dosage && (
          <p className="font-sans text-[10px] text-t4 mb-3">{product.dosage}</p>
        )}
        {product.partners && (
          <p className="font-sans text-[9px] text-t4 mb-3">{product.partners.name}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-serif text-lg text-gold">{fmt(product.price_cents)}</span>
          <button
            onClick={handleAdd}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans text-[10px] font-medium transition-all',
              added || inCart
                ? 'bg-gold/15 border border-gold/30 text-gold'
                : 'bg-white/[0.06] border border-white/[0.10] text-t2 hover:border-gold/25 hover:text-t1',
            ].join(' ')}
          >
            {added ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Ajouté
              </>
            ) : inCart ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Dans le panier
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Ajouter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductGrid({ products }: Props) {
  const [category, setCategory] = useState('all')
  const cart = useStore($cart)
  const total = cartTotal(cart)

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))]
  const filtered = category === 'all' ? products : products.filter((p) => p.category === category)
  const featured = filtered.filter((p) => p.featured)
  const regular = filtered.filter((p) => !p.featured)

  return (
    <div>
      {/* Filtres catégories */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={[
              'flex-shrink-0 px-4 py-2 rounded-full font-sans text-xs font-medium transition-all',
              category === cat
                ? 'bg-gold text-bg'
                : 'bg-white/[0.04] border border-white/[0.08] text-t3 hover:text-t1',
            ].join(' ')}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Cart flottant */}
      {cart.length > 0 && (
        <div className="mx-5 mb-4 glass p-4 flex items-center justify-between">
          <div>
            <p className="font-sans text-xs text-t3">{cart.length} article{cart.length > 1 ? 's' : ''}</p>
            <p className="font-serif text-lg text-gold">{fmt(total)}</p>
          </div>
          <a href="/app/marketplace/cart" className="btn-gold h-10 px-5 text-[9px]">
            Passer commande
          </a>
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className="px-5 mb-6">
          <span className="label text-gold block mb-3">Recommandés par FUEL</span>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Regular */}
      {regular.length > 0 && (
        <div className="px-5 mb-6">
          {featured.length > 0 && <span className="label block mb-3">Catalogue complet</span>}
          <div className="grid grid-cols-2 gap-3">
            {regular.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="px-5 py-12 text-center">
          <p className="font-sans text-sm text-t4">Aucun produit dans cette catégorie.</p>
        </div>
      )}
    </div>
  )
}
