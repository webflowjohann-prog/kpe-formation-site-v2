import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OAuthButtons } from './OAuthButtons'

interface RegisterFormProps {
  defaultPlan?: string
}

export function RegisterForm({ defaultPlan = 'free' }: RegisterFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  function validatePassword(p: string) {
    if (p.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
    return null
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }

    setLoading(true)

    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          plan: defaultPlan,
        },
      },
    })

    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Un compte existe déjà avec cet email.'
          : error.message
      )
      setLoading(false)
      return
    }

    // Si confirmation email requise
    if (data.user && !data.session) {
      setConfirmSent(true)
      setLoading(false)
      return
    }

    // Connexion directe (email confirmation désactivée en dev)
    window.location.href = '/onboarding'
  }

  // Email de confirmation envoyé
  if (confirmSent) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
            <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="font-serif text-xl text-t1 italic mb-2">Confirmez votre email</h3>
        <p className="font-sans text-sm text-t3 leading-relaxed mb-2">
          Un email de confirmation a été envoyé à
        </p>
        <p className="font-sans text-sm text-t1 mb-6">{email}</p>
        <p className="font-sans text-xs text-t4 leading-relaxed">
          Cliquez sur le lien dans l'email pour activer votre compte
          et démarrer votre onboarding.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* OAuth */}
      <OAuthButtons mode="register" />

      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="font-sans text-[10px] text-t4 uppercase tracking-[0.12em]">ou par email</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Formulaire */}
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <Input
          label="Nom complet"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Prénom Nom"
          autoComplete="name"
          required
        />
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
          placeholder="Minimum 8 caractères"
          autoComplete="new-password"
          hint="8 caractères minimum."
          required
        />

        {error && (
          <p className="font-sans text-[11px] text-red-400 leading-snug">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full mt-1">
          Créer mon compte
        </Button>

        <p className="font-sans text-[10px] text-t4 text-center leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <a href="/cgu" className="text-gold hover:underline">CGU</a>
          {' '}et notre{' '}
          <a href="/politique-confidentialite" className="text-gold hover:underline">politique de confidentialité</a>.
          Données hébergées en Europe (RGPD).
        </p>
      </form>
    </div>
  )
}
