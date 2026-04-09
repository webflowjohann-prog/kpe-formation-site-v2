import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'
import { generateWidgetSession } from '@/lib/terra'

export const POST: APIRoute = async ({ cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const session = await generateWidgetSession(user.id)
    return new Response(JSON.stringify({ url: session.url }), { status: 200 })
  } catch (err) {
    console.error('[terra/connect]', err)
    return new Response(
      JSON.stringify({ error: 'Impossible de générer la session Terra. Vérifiez les clés API.' }),
      { status: 500 }
    )
  }
}
