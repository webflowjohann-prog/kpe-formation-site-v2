import { atom, map } from 'nanostores'

export type AgentId = 'forge' | 'morphee' | 'fuel' | 'zenith' | 'atlas' | 'oracle'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent: AgentId
  created_at: string
  hasPrescription?: boolean
}

// Messages par agent { [agentId]: ChatMessage[] }
export const $chatMessages = map<Record<string, ChatMessage[]>>({})

// Agent en cours de réponse (streaming)
export const $chatLoading = atom<AgentId | null>(null)

export function addMessage(agent: AgentId, msg: ChatMessage) {
  const current = $chatMessages.get()
  const agentMsgs = current[agent] ?? []
  $chatMessages.setKey(agent, [...agentMsgs, msg])
}

export function setLoading(agent: AgentId | null) {
  $chatLoading.set(agent)
}

export function clearChat(agent: AgentId) {
  $chatMessages.setKey(agent, [])
}
