import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface OAuthButtonsProps {
  mode: 'login' | 'register'
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)

  async function handleOAuth(provider: 'google' | 'apple') {
    setLoading(provider)
    await getSupabase().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
      },
    })
    // Le navigateur redirige — pas de setLoading(null) nécessaire
  }

  const label = mode === 'login' ? 'Continuer' : 'S\'inscrire'

  return (
    <div class="flex flex-col gap-2.5">
      {/* Google */}
      <button
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
        className="w-full h-11 flex items-center justify-center gap-3 bg-card border border-white/[0.06] rounded-[12px] font-sans text-xs text-t2 hover:border-white/20 hover:text-t1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading === 'google' ? (
          <svg className="animate-spin w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span>{label} avec Google</span>
      </button>

      {/* Apple — affiché uniquement sur iOS/macOS via CSS */}
      <button
        onClick={() => handleOAuth('apple')}
        disabled={loading !== null}
        className="w-full h-11 flex items-center justify-center gap-3 bg-card border border-white/[0.06] rounded-[12px] font-sans text-xs text-t2 hover:border-white/20 hover:text-t1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading === 'apple' ? (
          <svg className="animate-spin w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.42.07 2.4.83 3.23.87.96-.17 1.88-.99 3.23-.99 1.31 0 2.31.62 3.02 1.56-2.66 1.66-2.23 5.3.43 6.42-.6 1.75-1.37 3.49-2.91 5.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
        )}
        <span>{label} avec Apple</span>
      </button>
    </div>
  )
}
