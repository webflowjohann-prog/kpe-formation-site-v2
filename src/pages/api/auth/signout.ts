import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const supabase = createServerSupabase(cookies)
  await supabase.auth.signOut()
  return redirect('/auth/login', 302)
}
