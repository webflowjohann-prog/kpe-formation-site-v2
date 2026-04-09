export type AgentId = 'forge' | 'morphee' | 'fuel' | 'zenith' | 'atlas' | 'oracle'

interface AgentConfig {
  name: string
  subtitle: string
  image: string
  tagline: string
}

const AGENTS: Record<AgentId, AgentConfig> = {
  forge: {
    name: 'FORGE',
    subtitle: 'Entraînement & Récupération',
    image: '/images/agents/forge.webp',
    tagline: 'Force. Endurance. Performance.',
  },
  morphee: {
    name: 'MORPHÉE',
    subtitle: 'Sommeil & Chronobiologie',
    image: '/images/agents/morphee.webp',
    tagline: 'Cycles. Profondeur. Restauration.',
  },
  fuel: {
    name: 'FUEL',
    subtitle: 'Nutrition & Suppléments',
    image: '/images/agents/fuel.webp',
    tagline: 'Nutriments. Carences. Précision.',
  },
  zenith: {
    name: 'ZÉNITH',
    subtitle: 'Mental & Stress',
    image: '/images/agents/zenith.webp',
    tagline: 'Clarté. Résilience. Cohérence.',
  },
  atlas: {
    name: 'ATLAS',
    subtitle: 'Expériences & Expéditions',
    image: '/images/agents/atlas.webp',
    tagline: 'Exploration. Préparation. Dépassement.',
  },
  oracle: {
    name: 'ORACLE',
    subtitle: 'Intelligence & Rapports',
    image: '/images/agents/oracle.webp',
    tagline: 'Score. Tendances. Coordination.',
  },
}

interface AgentHeaderProps {
  agent: AgentId
  subtitle?: string
}

export function AgentHeader({ agent, subtitle }: AgentHeaderProps) {
  const config = AGENTS[agent]

  return (
    <div className="relative h-52 overflow-hidden">
      {/* Photo B&W agent */}
      <img
        src={config.image}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover grayscale"
        style={{ opacity: 0.35 }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #0D0D0D 0%, rgba(13,13,13,0.7) 50%, rgba(13,13,13,0.1) 100%)',
        }}
      />

      {/* Contenu */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="label text-gold block mb-1.5">Agent</span>
        <h1 className="font-serif text-3xl text-t1 italic tracking-wide">{config.name}</h1>
        <p className="font-sans text-sm text-t3 mt-1">{subtitle ?? config.subtitle}</p>
      </div>
    </div>
  )
}
