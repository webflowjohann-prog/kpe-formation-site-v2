import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } = {}
  try { body = await request.json() } catch {}

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return new Response(JSON.stringify({ error: 'Invalid subscription' }), { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert({
    member_id: user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    user_agent: request.headers.get('user-agent') ?? null,
  }, { onConflict: 'member_id,endpoint' })

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { endpoint?: string } = {}
  try { body = await request.json() } catch {}

  if (body.endpoint) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('member_id', user.id)
      .eq('endpoint', body.endpoint)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
