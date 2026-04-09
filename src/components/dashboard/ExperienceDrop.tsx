export default function ExperienceDrop() {
  return (
    <section className="px-5 pt-6 pb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="label text-gold">ATLAS — Prochain drop</span>
        <span className="label">Bientôt</span>
      </div>

      <div className="relative glass overflow-hidden">
        {/* Background image B&W */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/agents/atlas.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%)',
            opacity: 0.12,
          }}
        />

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="agent-badge">ATLAS</span>
            <span className="label">Expédition</span>
          </div>

          <h3 className="font-serif text-xl text-t1 italic mb-2 leading-snug">
            Haute altitude — Patagonie
          </h3>
          <p className="font-sans text-xs text-t3 leading-relaxed mb-5">
            12 jours d'expédition en Patagonie avec préparation biométrique complète. Quota limité à 8 participants éligibles par leur score ORACLE.
          </p>

          {/* Stats */}
          <div className="flex gap-4 mb-5">
            {[
              { label: 'Durée', value: '12 jours' },
              { label: 'Altitude', value: '3 800 m' },
              { label: 'Places', value: '8 max' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="label">{s.label}</span>
                <span className="font-sans text-sm text-t1 font-medium">{s.value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="/app/agents/atlas"
            className="inline-flex items-center gap-2 btn-outline text-[9px] px-5 h-9"
          >
            Découvrir ATLAS
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
