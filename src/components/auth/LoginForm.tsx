import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OAuthButtons } from './OAuthButtons'

type Mode = 'password' | 'magic'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    const { error } = await getSupabase().auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message
      )
      setLoading(false)
    } else {
      window.location.href = '/app'
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  // Confirmation lien magique envoyé
  if (magicSent) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="font-serif text-xl text-t1 italic mb-2">Vérifiez votre email</h3>
        <p className="font-sans text-sm text-t3 leading-relaxed mb-6">
          Un lien de connexion a été envoyé à<br />
          <span className="text-t1">{email}</span>
        </p>
        <button
          onClick={() => { setMagicSent(false); setEmail('') }}
          className="font-sans text-xs text-t4 hover:text-gold transition-colors"
        >
          Utiliser un autre email
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* OAuth */}
      <OAuthButtons mode="login" />

      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="font-sans text-[10px] text-t4 uppercase tracking-[0.12em]">ou</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Toggle mode */}
      <div className="flex rounded-[12px] border border-white/[0.06] overflow-hidden">
        {(['password', 'magic'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError('') }}
            className={[
              'flex-1 h-9 font-sans font-medium text-[9px] uppercase tracking-[0.13em] transition-all',
              mode === m ? 'bg-gold/10 text-gold border-b border-gold/30' : 'text-t4 hover:text-t2',
            ].join(' ')}
          >
            {m === 'password' ? 'Mot de passe' : 'Lien magique'}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && (
            <p className="font-sans text-[11px] text-red-400 leading-snug">{error}</p>
          )}
          <Button type="submit" loading={loading} className="w-full mt-1">
            Se connecter
          </Button>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            hint="Vous recevrez un lien de connexion par email."
            required
          />
          {error && (
            <p className="font-sans text-[11px] text-red-400 leading-snug">{error}</p>
          )}
          <Button type="submit" loading={loading} className="w-full mt-1">
            Envoyer le lien
          </Button>
        </form>
      )}
    </div>
  )
}
