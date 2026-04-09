import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'
import { generateWidgetSession } from '@/lib/terra'

export const POST: APIRoute = async ({ cookies }) => {
  // Guard : clés Terra non configurées
  if (!import.meta.env.TERRA_API_KEY || !import.meta.env.TERRA_DEV_ID) {
    return new Response(
      JSON.stringify({ error: 'Intégration wearable non configurée (clés TERRA manquantes).' }),
      { status: 503 }
    )
  }

  let user: { id: string } | null = null
  try {
    const supabase = createServerSupabase(cookies)
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return new Response(JSON.stringify({ error: 'Erreur d\'authentification' }), { status: 401 })
  }

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
