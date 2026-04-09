import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'

interface ConfirmedResult {
  biomarker_id: string | null
  raw_name: string
  value: number
  unit: string
  confidence: number
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { results: ConfirmedResult[]; measured_at?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { results, measured_at } = body

  if (!results || results.length === 0) {
    return new Response(JSON.stringify({ error: 'No results to save' }), { status: 400 })
  }

  const date = measured_at ?? new Date().toISOString().slice(0, 10)

  // Insérer les résultats
  const rows = results.map((r) => ({
    member_id: user.id,
    biomarker_id: r.biomarker_id ?? null,
    raw_name: r.raw_name,
    value: r.value,
    unit: r.unit,
    measured_at: date,
    source: 'scanner',
    confidence: r.confidence,
    status: 'validated',
  }))

  const { data: inserted, error } = await supabase
    .from('biomarker_results')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('[scanner/confirm]', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Recalcul score simplifié : mettre à jour le score biomarqueur dans cortex_scores
  // Le vrai score calculator arrive en Sprint 6 — ici on insère juste une trace
  const validCount = results.filter((r) => r.biomarker_id).length
  const biomarkerScore = Math.min(Math.round((validCount / Math.max(results.length, 1)) * 70) + 30, 100)

  await supabase.from('cortex_scores').upsert(
    {
      member_id: user.id,
      score: biomarkerScore,
      level: biomarkerScore >= 85 ? 'Platinum' : biomarkerScore >= 70 ? 'Gold' : biomarkerScore >= 50 ? 'Silver' : 'Bronze',
      biomarker_score: biomarkerScore,
      calculated_at: date,
    },
    { onConflict: 'member_id,calculated_at' }
  )

  // Mettre à jour cortex_score dans members
  await supabase
    .from('members')
    .update({ cortex_score: biomarkerScore })
    .eq('id', user.id)

  return new Response(
    JSON.stringify({ inserted: inserted?.length ?? 0, new_score: biomarkerScore }),
    { status: 200 }
  )
}
