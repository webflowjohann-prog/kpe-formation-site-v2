import { atom, map } from 'nanostores'
import type { User } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────

export type MemberPlan = 'free' | 'starter' | 'pro' | 'elite'

export interface Member {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: MemberPlan
  cortex_score?: number
  onboarding_completed: boolean
  terra_user_id?: string
  created_at: string
}

// ── Stores ────────────────────────────────────────────────

/** Utilisateur Supabase Auth */
export const $user = atom<User | null>(null)

/** Profil member enrichi depuis la table `members` */
export const $member = atom<Member | null>(null)

/** Score ORACLE courant (0-100) */
export const $cortexScore = atom<number>(0)

/** Chargement en cours */
export const $authLoading = atom<boolean>(true)

// ── Store navigation agents ───────────────────────────────

export type AgentId = 'forge' | 'morphee' | 'fuel' | 'zenith' | 'atlas' | 'oracle'

export const $activeAgent = atom<AgentId | null>(null)
