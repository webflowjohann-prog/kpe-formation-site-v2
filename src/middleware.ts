import { defineMiddleware } from 'astro:middleware'
import { createServerSupabase } from '@/lib/supabase'

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register', '/auth/callback']
const PROTECTED_PATHS = ['/app', '/onboarding']

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, redirect, url, locals } = context

  // Ignorer les assets statiques
  if (url.pathname.startsWith('/_astro') || url.pathname.startsWith('/fonts') || url.pathname.startsWith('/images')) {
    return next()
  }

  const supabase = createServerSupabase(cookies)
  locals.supabase = supabase

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  locals.user = error ? null : user

  const isProtected = PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))
  const isAuthPage = url.pathname.startsWith('/auth')

  // Rediriger vers login si route protégée sans session
  if (isProtected && !locals.user) {
    const redirectUrl = new URL('/auth/login', url)
    redirectUrl.searchParams.set('redirect', url.pathname)
    return redirect(redirectUrl.toString())
  }

  // Rediriger vers /app si déjà connecté sur pages auth
  if (isAuthPage && locals.user && url.pathname !== '/auth/callback') {
    return redirect('/app')
  }

  // Vérifier onboarding pour les routes /app/*
  if (locals.user && url.pathname.startsWith('/app') && url.pathname !== '/app') {
    const { data: member } = await supabase
      .from('members')
      .select('onboarding_completed')
      .eq('id', locals.user.id)
      .maybeSingle()

    locals.memberOnboarded = member?.onboarding_completed ?? false

    if (!locals.memberOnboarded) {
      return redirect('/onboarding')
    }
  }

  return next()
})
