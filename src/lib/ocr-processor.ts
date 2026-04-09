import { getClaudeClient, CLAUDE_MODEL } from './claude'

export interface ExtractedBiomarker {
  name: string
  value: number
  unit: string
  reference_range: string | null
}

const SYSTEM_PROMPT = `Tu es un expert en biologie médicale. Tu analyses des images d'analyses de sang, d'urine ou de tout bilan médical.
Extrais TOUS les biomarqueurs visibles avec leurs valeurs numériques.
Ne retourne que du JSON valide, sans markdown, sans commentaire.`

const USER_PROMPT = `Extrait tous les biomarqueurs de cette image.

Réponds UNIQUEMENT avec un tableau JSON :
[
  {
    "name": "Nom exact du biomarqueur tel qu'écrit",
    "value": 12.5,
    "unit": "nmol/L",
    "reference_range": "75-200 ou null"
  }
]

Règles :
- Utilise exactement le nom tel qu'il apparaît dans le document
- La valeur doit être un nombre (pas une string)
- L'unité doit être exactement celle du document
- Si la plage de référence n'est pas visible, mets null
- Si ce n'est pas une analyse biologique, retourne []`

export async function extractBiomarkersFromImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<ExtractedBiomarker[]> {
  const claude = getClaudeClient()

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  })

  const text = response.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('')

  // Tenter le parse direct
  try {
    const parsed = JSON.parse(text.trim())
    if (Array.isArray(parsed)) return parsed as ExtractedBiomarker[]
  } catch {
    // Extraire le JSON du texte si entouré de prose
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        return JSON.parse(match[0]) as ExtractedBiomarker[]
      } catch {}
    }
  }

  return []
}
