import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'
import { extractBiomarkersFromImage } from '@/lib/ocr-processor'
import { matchBiomarker } from '@/lib/biomarker-matcher'
import type { KnownBiomarker } from '@/lib/biomarker-matcher'

const MAX_SIZE_MB = 10

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { image: string; media_type?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { image, media_type = 'image/jpeg' } = body

  if (!image) {
    return new Response(JSON.stringify({ error: 'Missing image' }), { status: 400 })
  }

  // Vérifier la taille (base64 ≈ 4/3 * bytes)
  const sizeBytes = (image.length * 3) / 4
  if (sizeBytes > MAX_SIZE_MB * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'Image trop volumineuse (max 10MB)' }), { status: 413 })
  }

  // Charger la knowledge base
  const { data: knownBiomarkers } = await supabase
    .from('biomarker_knowledge')
    .select('id, name, aliases, category, standard_unit, normal_min, normal_max, optimal_min, optimal_max')

  if (!knownBiomarkers) {
    return new Response(JSON.stringify({ error: 'Knowledge base unavailable' }), { status: 500 })
  }

  // Extraction via Claude Vision
  let extracted: Awaited<ReturnType<typeof extractBiomarkersFromImage>>
  try {
    extracted = await extractBiomarkersFromImage(
      image,
      media_type as 'image/jpeg' | 'image/png' | 'image/webp'
    )
  } catch (err) {
    console.error('[scanner/ocr]', err)
    return new Response(JSON.stringify({ error: 'Erreur Claude Vision' }), { status: 500 })
  }

  if (extracted.length === 0) {
    return new Response(
      JSON.stringify({ results: [], message: "Aucun biomarqueur détecté. Vérifiez l'image." }),
      { status: 200 }
    )
  }

  // Matching contre la knowledge base
  const results = extracted.map((item) => {
    const match = matchBiomarker(item.name, knownBiomarkers as KnownBiomarker[])
    return {
      raw_name: item.name,
      value: item.value,
      unit: item.unit,
      reference_range: item.reference_range,
      matched_biomarker_id: match.biomarker?.id ?? null,
      matched_name: match.biomarker?.name ?? null,
      matched_category: match.biomarker?.category ?? null,
      standard_unit: match.biomarker?.standard_unit ?? null,
      normal_min: match.biomarker?.normal_min ?? null,
      normal_max: match.biomarker?.normal_max ?? null,
      confidence: match.confidence,
    }
  })

  return new Response(JSON.stringify({ results }), { status: 200 })
}
