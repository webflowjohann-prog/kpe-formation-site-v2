interface DailyBriefData {
  content: string
  priorities: string[] | null
  brief_date: string
}

interface Props {
  brief: DailyBriefData | null
  firstName: string
}

function today(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function DailyBrief({ brief, firstName }: Props) {
  if (!brief) {
    return (
      <section className="px-5 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="label text-gold">Daily Brief</span>
          <span className="font-sans text-[10px] text-t4">{today()}</span>
        </div>
        <div className="glass p-6">
          <h3 className="font-serif text-xl text-t1 italic mb-2">
            Bonjour{firstName ? `, ${firstName.split(' ')[0]}` : ''}.
          </h3>
          <p className="font-sans text-sm text-t3 leading-relaxed mb-5">
            ORACLE analysera vos données chaque matin pour vous livrer un Brief personnalisé — score, tendances et priorités du jour.
          </p>
          <a
            href="/app/agents/oracle"
            className="inline-flex items-center gap-2 btn-gold text-[9px] px-5 h-9"
          >
            Parler à ORACLE
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="px-5 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label text-gold">Daily Brief — ORACLE</span>
        <span className="font-sans text-[10px] text-t4">{today()}</span>
      </div>
      <div className="glass p-6">
        <p className="font-sans text-sm text-t2 leading-relaxed mb-5">{brief.content}</p>

        {brief.priorities && brief.priorities.length > 0 && (
          <div className="border-t border-white/[0.06] pt-4">
            <p className="label mb-3">Priorités du jour</p>
            <ol className="flex flex-col gap-2">
              {brief.priorities.slice(0, 3).map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-sans text-[9px] text-gold font-medium">
                    {i + 1}
                  </span>
                  <span className="font-sans text-xs text-t2 leading-relaxed pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
