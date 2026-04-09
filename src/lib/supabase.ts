import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string

/**
 * Client navigateur — lazy singleton pour les React islands (client:load).
 * Utiliser getSupabase() dans les composants React côté client.
 */
let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _browserClient
}

/**
 * Client serveur — à créer par requête.
 * Utiliser dans les pages .astro, middleware et API routes.
 */
export function createServerSupabase(cookies: AstroCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options)
        })
      },
    },
  })
}

/**
 * Client service-role — UNIQUEMENT côté serveur (API routes, scripts).
 * Ne jamais importer dans du code client.
 */
export function createAdminSupabase() {
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string
  return createServerClient(supabaseUrl, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type { User, Session } from '@supabase/supabase-js'
