import { useState } from 'react'
import { useStore } from '@nanostores/react'
import AgentChat from '../AgentChat'
import type { AgentId } from '@/stores/chat'
import { $cart, addToCart } from '@/stores/cart'

const AGENT: AgentId = 'forge'

interface TrainingData {
  training_frequency: number | null
  sports: string[] | null
  training_goal: string | null
  resting_hr: number | null
  injuries: string | null
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
  trainingData: TrainingData
  prescriptions: Prescription[]
  products: Product[]
}

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function RecoveryProductCard({ product }: { product: Product }) {
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

const TABS = ['Chat', 'Plan', 'Récupération'] as const
type Tab = (typeof TABS)[number]

const METHODS = [
  {
    name: 'IMPACT',
    subtitle: 'Force & Puissance',
    desc: 'Entraînements à haute intensité ciblant la force maximale et la puissance explosive.',
    icon: '⚡',
    color: 'text-red-400',
    border: 'border-red-500/20',
  },
  {
    name: 'FLOW',
    subtitle: 'Endurance & Base',
    desc: 'Zone 2 et cardio doux pour construire une base aérobique solide et favoriser la récupération.',
    icon: '🌊',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  {
    name: 'VISION',
    subtitle: 'Mobilité & Prévention',
    desc: 'Travail de mobilité, stabilisation et prévention des blessures adapté à vos restrictions.',
    icon: '🎯',
    color: 'text-gold',
    border: 'border-gold/20',
  },
]

const INTENSITY = [
  { label: 'Zone 1', name: 'Récupération active', range: '<60% FCmax', color: 'bg-blue-500/20' },
  { label: 'Zone 2', name: 'Endurance fondamentale', range: '60-70% FCmax', color: 'bg-green-500/20' },
  { label: 'Zone 3', name: 'Tempo', range: '70-80% FCmax', color: 'bg-gold/20' },
  { label: 'Zone 4', name: 'Seuil lactique', range: '80-90% FCmax', color: 'bg-orange-500/20' },
  { label: 'Zone 5', name: 'VO2max', range: '>90% FCmax', color: 'bg-red-500/20' },
]

function PlanTab({ data, prescriptions }: { data: TrainingData; prescriptions: Prescription[] }) {
  const { training_frequency, sports, training_goal } = data

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Profil entraînement */}
      <div className="glass p-5">
        <p className="label mb-4">Profil entraînement</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center glass p-3">
            <span className="font-serif text-2xl text-gold mb-1">{training_frequency ?? '—'}</span>
            <span className="font-sans text-[9px] text-t4 text-center">séances / semaine</span>
          </div>
          <div className="flex flex-col items-center glass p-3 col-span-2">
            <span className="label mb-2 self-start">Types déclarés</span>
            {sports && sports.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 w-full">
                {sports.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full border border-white/[0.08] font-sans text-[9px] text-t3">{t}</span>
                ))}
              </div>
            ) : (
              <span className="font-sans text-xs text-t4">Non renseigné</span>
            )}
          </div>
        </div>
        {training_goal && (
          <div>
            <p className="label mb-2">Objectif</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 font-sans text-[9px] text-gold">{training_goal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Méthodes FORGE */}
      <div>
        <p className="label mb-3">Méthodes FORGE</p>
        <div className="flex flex-col gap-3">
          {METHODS.map((m) => (
            <div key={m.name} className={`glass p-4 border ${m.border}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{m.icon}</span>
                <div>
                  <p className={`font-sans text-sm font-semibold ${m.color}`}>{m.name}</p>
                  <p className="font-sans text-[10px] text-t4">{m.subtitle}</p>
                </div>
              </div>
              <p className="font-sans text-xs text-t3 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prescriptions actives */}
      {prescriptions.length > 0 && (
        <div>
          <p className="label mb-3">Plan actif prescrit</p>
          <div className="flex flex-col gap-3">
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
          </div>
        </div>
      )}

      {prescriptions.length === 0 && (
        <div className="glass p-4 text-center">
          <p className="font-sans text-xs text-t3 mb-3">
            Discutez avec FORGE pour recevoir votre plan d'entraînement personnalisé.
          </p>
        </div>
      )}
    </div>
  )
}

function RecuperationTab({ data, products }: { data: TrainingData; products: Product[] }) {
  const { resting_hr, injuries } = data

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* Indicateurs */}
      <div className="glass p-5">
        <p className="label mb-4">Indicateurs de récupération</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-4 flex flex-col items-center">
            <span className="font-sans text-[9px] text-t4 mb-1">FC repos déclarée</span>
            <span className="font-serif text-2xl text-t1">{resting_hr ?? '—'}</span>
            <span className="font-sans text-[9px] text-t4 mt-0.5">bpm</span>
          </div>
          <div className="glass p-4 flex flex-col items-center">
            <span className="font-sans text-[9px] text-t4 mb-1">HRV</span>
            <span className="font-serif text-2xl text-t4">—</span>
            <span className="font-sans text-[9px] text-t4 mt-0.5">Connecter wearable</span>
          </div>
        </div>
      </div>

      {/* Zones d'intensité */}
      <div className="glass p-5">
        <p className="label mb-4">Zones d'intensité</p>
        <div className="flex flex-col gap-2">
          {INTENSITY.map((z) => (
            <div key={z.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${z.color.replace('/20', '')}`} />
              <span className="font-sans text-[10px] text-t4 w-12">{z.label}</span>
              <span className="font-sans text-xs text-t2 flex-1">{z.name}</span>
              <span className="font-sans text-[10px] text-t4">{z.range}</span>
            </div>
          ))}
        </div>
        <p className="font-sans text-[10px] text-t4 mt-3">
          Connectez un wearable pour un calcul basé sur votre FC réelle.
        </p>
      </div>

      {/* Blessures */}
      {injuries && injuries.trim().length > 0 && injuries.toLowerCase() !== 'aucune' && (
        <div className="glass p-4">
          <p className="label mb-2 text-orange-400">Points de vigilance</p>
          <p className="font-sans text-xs text-orange-400 leading-relaxed">{injuries}</p>
        </div>
      )}

      <a href="/app/profile" className="btn-outline h-10 flex items-center justify-center text-[10px]">
        Connecter un wearable pour le suivi HRV
      </a>

      {products.length > 0 && (
        <div>
          <p className="label mb-3">Équipement récupération</p>
          <div className="flex flex-col gap-3">
            {products.map((p) => <RecoveryProductCard key={p.id} product={p} />)}
          </div>
          <a href="/app/marketplace" className="btn-outline h-9 w-full flex items-center justify-center text-[10px] mt-3">
            Voir tout le catalogue
          </a>
        </div>
      )}
    </div>
  )
}

export default function ForgeDashboard({ memberId, trainingData, prescriptions, products }: Props) {
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
      {tab === 'Plan' && <PlanTab data={trainingData} prescriptions={prescriptions} />}
      {tab === 'Récupération' && <RecuperationTab data={trainingData} products={products} />}
    </div>
  )
}
