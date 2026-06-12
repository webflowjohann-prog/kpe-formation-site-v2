import { useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { ChatBubble } from '../ui/ChatBubble'
import { $chatMessages, $chatLoading, addMessage, setLoading } from '@/stores/chat'
import type { AgentId, ChatMessage } from '@/stores/chat'
import { getSupabase } from '@/lib/supabase'

interface Props {
  agent: AgentId
  memberId: string
}

const AGENT_PLACEHOLDER: Record<AgentId, string> = {
  forge: "Demandez un programme, ajustez l'intensité, analysez votre récupération…",
  morphee: "Parlez de votre sommeil, demandez un rituel du soir, analysez vos cycles…",
  fuel: "Demandez un plan repas, vérifiez une interaction, prescrivez un supplément…",
  zenith: "Parlez de votre stress, demandez un protocole de respiration…",
  atlas: "Explorez les expéditions disponibles, évaluez votre éligibilité…",
  oracle: "Demandez votre Daily Brief, analysez vos tendances, synthétisez vos données…",
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AgentChat({ agent, memberId }: Props) {
  const allMessages = useStore($chatMessages)
  const loading = useStore($chatLoading)
  const messages: ChatMessage[] = allMessages[agent] ?? []
  const isLoading = loading === agent

  const [input, setInput] = useState('')
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const autoBriefDone = useRef(false)

  // Charger l'historique Supabase au montage
  useEffect(() => {
    if (historyLoaded || messages.length > 0) return
    const sb = getSupabase()
    sb.from('agent_conversations')
      .select('id, role, content, created_at')
      .eq('member_id', memberId)
      .eq('agent', agent)
      .order('created_at', { ascending: true })
      .limit(40)
      .then(({ data }) => {
        if (data && data.length > 0) {
          data.forEach((m) =>
            addMessage(agent, {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              agent,
              created_at: m.created_at,
            })
          )
        }
        setHistoryLoaded(true)
      })
  }, [agent, memberId])

  // Auto-briefing : déclenché quand l'historique est chargé et vide
  useEffect(() => {
    if (!historyLoaded) return
    if (messages.length > 0) return
    if (autoBriefDone.current) return
    autoBriefDone.current = true

    setLoading(agent)
    fetch('/api/agents/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, message: 'BRIEFING_AUTO' }),
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        addMessage(agent, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          agent,
          created_at: new Date().toISOString(),
          hasPrescription: !!data.prescription,
        })
      })
      .catch(() => {
        addMessage(agent, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Je suis prêt à vous accompagner. Posez-moi votre première question.',
          agent,
          created_at: new Date().toISOString(),
        })
      })
      .finally(() => setLoading(null))
  }, [historyLoaded, agent])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function send() {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      agent,
      created_at: new Date().toISOString(),
    }
    addMessage(agent, userMsg)
    setInput('')
    setLoading(agent)

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, message: text }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()

      const agentMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        agent,
        created_at: new Date().toISOString(),
        hasPrescription: !!data.prescription,
      }
      addMessage(agent, agentMsg)

      if (data.prescription) {
        // Notification prescription silencieuse — le dashboard se met à jour au prochain chargement
      }
    } catch {
      addMessage(agent, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Une erreur est survenue. Vérifiez votre connexion et réessayez.',
        agent,
        created_at: new Date().toISOString(),
      })
    } finally {
      setLoading(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 14rem)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
              <span className="font-sans font-medium text-[9px] text-gold uppercase tracking-widest">
                {agent.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <p className="font-sans text-xs text-t4 leading-relaxed max-w-xs">
              {AGENT_PLACEHOLDER[agent]}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatBubble role={msg.role} agent={agent.toUpperCase()} timestamp={formatTime(msg.created_at)}>
              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            </ChatBubble>
            {msg.hasPrescription && (
              <div className="flex justify-start mt-2 ml-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 font-sans text-[9px] text-gold uppercase tracking-widest">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 2v2l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Prescription ajoutée
                </span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <ChatBubble role="assistant" agent={agent.toUpperCase()} isStreaming>
            <span />
          </ChatBubble>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 pb-4 pt-2 border-t border-black/[0.06]">
        <div className="flex items-end gap-3 bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-3 focus-within:border-gold/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={AGENT_PLACEHOLDER[agent]}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent font-sans text-sm text-t1 placeholder:text-t4 resize-none focus:outline-none disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-xl bg-gold flex items-center justify-center transition-all hover:bg-gold-hover disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Envoyer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 11V3M3 7l4-4 4 4" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="font-sans text-[9px] text-t4 text-center mt-2">
          Ne remplace pas un avis médical professionnel
        </p>
      </div>
    </div>
  )
}
