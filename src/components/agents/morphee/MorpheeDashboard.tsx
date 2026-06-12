import { useState } from 'react'
import { useStore } from '@nanostores/react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'
import { $cart, addToCart } from '@/stores/cart'

const AGENT: AgentId = 'morphee'

interface SleepData {
  sleep_hours: number | null
  sleep_quality: number | null
  morning_freshness: number | null
  bedtime: string | null
  wake_time: string | null
  sleep_issues: string[] | null
}

interface Prescription {
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
  dosage: string | null
  partners: { name: string } | null
}

interface Props {
  memberId: string
  sleepData: SleepData
  prescriptions: Prescription[]
  products: Product[]
}

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function SleepProductCard({ product }: { product: Product }) {
  const cart = useStore($cart)
  const inCart = cart.find((i) => i.productId === product.id)
  const [added, setAdded] = useState(false)
  function handleAdd() {
    addToCart({ productId: product.id, name: product.name, price_cents: product.price_cents, quantity: 1, partner_name: product.partners?.name })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }
  return (
    <div className="glass p-4">
      <p className="font-sans text-sm font-medium text-t1 mb-0.5">{product.name}</p>
      {product.partners && <p className="font-sans text-[10px] text-t4">{product.partners.name}</p>}
      {product.description && <p className="font-sans text-[11px] text-t3 leading-relaxed mt-1 line-clamp-2">{product.description}</p>}
      {product.dosage && <p className="font-sans text-[10px] text-t4 mt-0.5">{product.dosage}</p>}
      <div className="flex items-center justify-between mt-3">
        <span className="font-serif text-base text-gold">{fmt(product.price_cents)}</span>
        <button
          onClick={handleAdd}
          className={['px-3 py-1.5 rounded-xl font-sans text-[10px] font-medium transition-all', added || inCart ? 'bg-gold/15 border border-gold/30 text-gold' : 'bg-surface border border-border text-t2 hover:border-gold/25'].join(' ')}
        >
          {added ? 'Ajouté' : inCart ? 'Dans le panier' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

const TABS = ['Chat', 'Analyse', 'Protocole'] as const
type Tab = (typeof TABS)[number]

function sleepLabel(hours: number | null): string {
  if (!hours) return '—'
  if (hours < 6) return 'Insuffisant'
  if (hours < 7) return 'Limite'
  if (hours <= 9) return 'Optimal'
  return 'Excessif'
}

function qualityColor(q: number | null): string {
  if (!q) return 'text-t4'
  if (q >= 7) return 'text-green-400'
  if (q >= 5) return 'text-gold'
  return 'text-red-400'
}

function AnalyseTab({ data }: { data: SleepData }) {
  const { sleep_hours, sleep_quality, morning_freshness, bedtime, wake_time, sleep_issues } = data

  const metrics = [
    {
      label: 'Durée nuit',
      value: sleep_hours ? `${sleep_hours}h` : '—',
      sub: sleepLabel(sleep_hours),
      color: sleep_hours && sleep_hours >= 7 && sleep_hours <= 9 ? 'text-green-400' : 'text-gold',
    },
    {
      label: 'Qualité',
      value: sleep_quality ? `${sleep_quality}/10` : '—',
      sub: sleep_quality ? (sleep_quality >= 7 ? 'Bonne' : sleep_quality >= 5 ? 'Moyenne' : 'Mauvaise') : 'Non évalué',
      color: qualityColor(sleep_quality),
    },
    {
      label: 'Réveil',
      value: morning_freshness ? `${morning_freshness}/10` : '—',
      sub: morning_freshness ? (morning_freshness >= 7 ? 'Reposé' : 'Fatigué') : '—',
      color: qualityColor(morning_freshness),
    },
  ]

  return (
    <div className="px-5 py-4">
      {/* Horaires */}
      {(bedtime || wake_time) && (
        <div className="glass p-5 mb-4">
          <p className="label mb-3">Fenêtre de sommeil déclarée</p>
          <div className="flex gap-6">
            {bedtime && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Coucher</p>
                <p className="font-serif text-xl text-t1">{bedtime}</p>
              </div>
            )}
            {wake_time && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Réveil</p>
                <p className="font-serif text-xl text-t1">{wake_time}</p>
              </div>
            )}
            {bedtime && wake_time && sleep_hours && (
              <div>
                <p className="font-sans text-[10px] text-t4 mb-0.5">Durée</p>
                <p className="font-serif text-xl text-gold">{sleep_hours}h</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass p-4 flex flex-col items-center text-center">
            <span className="label mb-2">{m.label}</span>
            <span className={`font-serif text-2xl mb-1 ${m.color}`}>{m.value}</span>
            <span className="font-sans text-[9px] text-t4">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Troubles */}
      {sleep_issues && sleep_issues.length > 0 && !sleep_issues.includes('Aucun trouble particulier') && (
        <div className="glass p-4 mb-4">
          <p className="label mb-2">Troubles identifiés</p>
          <div className="flex flex-wrap gap-2">
            {sleep_issues.map((issue) => (
              <span key={issue} className="px-3 py-1 rounded-full border border-white/[0.08] font-sans text-[10px] text-t3">
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA wearable */}
      <div className="glass p-4 text-center">
        <p className="font-sans text-xs text-t3 mb-3">
          Connectez un wearable pour voir vos cycles NREM/REM en temps réel.
        </p>
        <a href="/app/profile" className="btn-outline h-9 px-4 text-[9px] inline-flex items-center">
          Connecter un wearable
        </a>
      </div>
    </div>
  )
}

function ProtocoleTab({ prescriptions, products }: { prescriptions: Prescription[]; products: Product[] }) {
  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {products.length > 0 && (
        <div>
          <span className="label text-gold block mb-3">Produits sommeil</span>
          <div className="flex flex-col gap-3 mb-2">
            {products.map((p) => <SleepProductCard key={p.id} product={p} />)}
          </div>
          <a href="/app/marketplace" className="btn-outline h-9 w-full flex items-center justify-center text-[10px]">
            Voir tout le catalogue
          </a>
        </div>
      )}
      {prescriptions.length > 0 ? (
        <>
          <span className="label text-gold">Protocole du soir actif</span>
          {prescriptions.map((p, i) => (
            <div key={p.id} className="glass p-4 flex gap-4 items-start">
              <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-sans text-[9px] text-gold font-medium">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-t1 mb-0.5">{p.title}</p>
                {p.description && <p className="font-sans text-xs text-t3 leading-relaxed">{p.description}</p>}
                <div className="flex gap-3 mt-2">
                  {p.timing && <span className="font-sans text-[10px] text-t4">{p.timing}</span>}
                  {p.duration && <span className="font-sans text-[10px] text-t4">{p.duration}</span>}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="glass p-4 text-center">
          <p className="font-sans text-xs text-t3 mb-1">Aucun protocole actif.</p>
          <p className="font-sans text-xs text-t4">
            Parlez à MORPHÉE pour recevoir votre routine du soir personnalisée.
          </p>
        </div>
      )}
    </div>
  )
}

export default function MorpheeDashboard({ memberId, sleepData, prescriptions, products }: Props) {
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
              tab === t ? 'text-t1 font-bold border-gold' : 'text-t3 font-medium border-transparent hover:text-t2',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AgentChat agent={AGENT} memberId={memberId} />}
      {tab === 'Analyse' && <AnalyseTab data={sleepData} />}
      {tab === 'Protocole' && <ProtocoleTab prescriptions={prescriptions} products={products} />}
    </div>
  )
}
