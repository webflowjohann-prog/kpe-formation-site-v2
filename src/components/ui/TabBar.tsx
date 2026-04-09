interface TabBarProps {
  currentPath?: string
}

interface Tab {
  id: string
  label: string
  href: string
  exact: boolean
}

const TABS: Tab[] = [
  { id: 'home', label: 'Accueil', href: '/app', exact: true },
  { id: 'agents', label: 'Agents', href: '/app/agents', exact: false },
  { id: 'scanner', label: 'Scanner', href: '/app/scanner', exact: false },
  { id: 'boutique', label: 'Boutique', href: '/app/marketplace', exact: false },
  { id: 'profil', label: 'Profil', href: '/app/profile', exact: false },
]

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 8.5L10 2l7 6.5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 18v-5.5h5V18" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function AgentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 3v4M10 13v4M3 10h4M13 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ScannerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="13" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 13h2m2 0h2M13 15.5h2M15 13v2m0 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 3h1.5l2 9h9l1.5-6H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="14" cy="15.5" r="1" fill="currentColor" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 17c0-3 3.1-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const ICONS: Record<string, () => JSX.Element> = {
  home: HomeIcon,
  agents: AgentsIcon,
  scanner: ScannerIcon,
  boutique: ShopIcon,
  profil: ProfileIcon,
}

export default function TabBar({ currentPath = '/app' }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 h-20 flex items-start justify-around px-2 pt-2 bg-surface/90 backdrop-blur-[20px] border-t border-white/[0.06]"
      aria-label="Navigation principale"
    >
      {TABS.map((tab) => {
        const active = tab.exact ? currentPath === tab.href : currentPath.startsWith(tab.href)
        const Icon = ICONS[tab.id]
        return (
          <a
            key={tab.id}
            href={tab.href}
            className={['flex flex-col items-center gap-1 px-3 py-1.5 rounded-[12px] transition-all duration-200', active ? 'text-gold' : 'text-t4 hover:text-t2'].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            <span className={['font-sans font-medium uppercase tracking-[0.12em] text-[7px]', active ? 'text-gold' : 'text-t4'].join(' ')}>
              {tab.label}
            </span>
          </a>
        )
      })}
    </nav>
  )
}
