import type { APIRoute } from 'astro'
import { createServerSupabase } from '@/lib/supabase'
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude'
import { buildSystemPrompt } from '@/lib/agent-prompts'
import type { AgentId, MemberContext, ConversationContext } from '@/lib/agent-prompts'

const VALID_AGENTS: AgentId[] = ['forge', 'morphee', 'fuel', 'zenith', 'atlas', 'oracle']

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { agent: string; message: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { agent, message } = body
  if (!agent || !VALID_AGENTS.includes(agent as AgentId)) {
    return new Response(JSON.stringify({ error: 'Invalid agent' }), { status: 400 })
  }
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 })
  }

  const agentId = agent as AgentId

  // Récupérer profil membre
  const { data: member } = await supabase
    .from('members')
    .select('full_name, age, gender, primary_goal, activity_level, health_conditions, medications, diet_type, supplements, stress_level, sleep_hours, sleep_quality, training_frequency, performance_level, sports, has_wearable, wearable_brand, cortex_score')
    .eq('id', user.id)
    .single()

  // Récupérer prescriptions actives
  const { data: prescriptions } = await supabase
    .from('agent_prescriptions')
    .select('agent, type, title, description, timing')
    .eq('member_id', user.id)
    .eq('status', 'active')
    .limit(10)

  // Récupérer historique conversation (30 derniers messages)
  const { data: history } = await supabase
    .from('agent_conversations')
    .select('role, content')
    .eq('member_id', user.id)
    .eq('agent', agentId)
    .order('created_at', { ascending: false })
    .limit(30)

  const activePrescriptions = prescriptions
    ?.map((p) => `[${p.agent.toUpperCase()}] ${p.type}: ${p.title} — ${p.description ?? ''} (${p.timing ?? ''})`)
    .join('\n') ?? ''

  const ctx: ConversationContext = {
    member: (member ?? {}) as MemberContext,
    activePrescriptions,
    recentMetrics: '',
    recentBiomarkers: '',
  }

  const systemPrompt = buildSystemPrompt(agentId, ctx)

  // Construire l'historique pour Claude (ordre chronologique)
  const historyMessages = (history ?? []).reverse().map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Sauvegarder le message utilisateur
  await supabase.from('agent_conversations').insert({
    member_id: user.id,
    agent: agentId,
    role: 'user',
    content: message,
  })

  // Appel Claude API
  const claude = getClaudeClient()
  const claudeResponse = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...historyMessages,
      { role: 'user', content: message },
    ],
  })

  const responseText = claudeResponse.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('')

  // Sauvegarder la réponse agent
  await supabase.from('agent_conversations').insert({
    member_id: user.id,
    agent: agentId,
    role: 'assistant',
    content: responseText,
  })

  // Parser et insérer les prescriptions si présentes
  const prescriptionMatch = responseText.match(/```prescription\s*([\s\S]*?)```/)
  let newPrescription: Record<string, string> | null = null

  if (prescriptionMatch) {
    try {
      const parsed = JSON.parse(prescriptionMatch[1].trim())
      await supabase.from('agent_prescriptions').insert({
        member_id: user.id,
        agent: agentId,
        type: parsed.type ?? 'nutrition',
        title: parsed.title ?? 'Prescription',
        description: parsed.description,
        timing: parsed.timing,
        duration: parsed.duration,
        priority: parsed.priority ?? 'medium',
        status: 'active',
      })
      newPrescription = parsed
    } catch {
      // Malformed JSON — ignore
    }
  }

  // Nettoyer le bloc prescription du texte affiché
  const cleanResponse = responseText.replace(/```prescription[\s\S]*?```/g, '').trim()

  return new Response(
    JSON.stringify({ response: cleanResponse, prescription: newPrescription }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
