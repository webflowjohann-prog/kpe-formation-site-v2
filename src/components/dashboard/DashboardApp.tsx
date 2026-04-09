import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import CortexScore from './CortexScore'
import type { ScoreData } from './CortexScore'
import DailyBrief from './DailyBrief'
import PrescriptionTimeline from './PrescriptionTimeline'
import AlertsFeed from './AlertsFeed'
import type { AlertData } from './AlertsFeed'
import ExperienceDrop from './ExperienceDrop'
import type { Prescription } from '../ui/PrescriptionCard'

interface Props {
  memberId: string
}

function greeting(name: string): string {
  const h = new Date().getHours()
  const firstName = name.split(' ')[0]
  if (h < 12) return `Bonjour${firstName ? `, ${firstName}` : ''}.`
  if (h < 18) return `Bon après-midi${firstName ? `, ${firstName}` : ''}.`
  return `Bonsoir${firstName ? `, ${firstName}` : ''}.`
}

function Skeleton() {
  return (
    <div className="px-5 pt-6 flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-44 h-44 rounded-full bg-white/[0.04]" />
        <div className="w-20 h-5 rounded-full bg-white/[0.04]" />
      </div>
      <div className="h-32 rounded-[20px] bg-white/[0.04]" />
      <div className="h-24 rounded-[20px] bg-white/[0.04]" />
    </div>
  )
}

export default function DashboardApp({ memberId }: Props) {
  const [loading, setLoading] = useState(true)
  const [memberName, setMemberName] = useState('')
  const [memberScore, setMemberScore] = useState(0)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [brief, setBrief] = useState<{ content: string; priorities: string[] | null; brief_date: string } | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])

  useEffect(() => {
    const sb = getSupabase()
    const today = new Date().toISOString().slice(0, 10)

    Promise.all([
      sb.from('members').select('full_name, cortex_score').eq('id', memberId).single(),
      sb.from('cortex_scores').select('*').eq('member_id', memberId).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('agent_prescriptions').select('*').eq('member_id', memberId).in('status', ['active', 'completed', 'skipped']).order('created_at', { ascending: false }).limit(20),
      sb.from('daily_briefs').select('content, priorities, brief_date').eq('member_id', memberId).eq('brief_date', today).maybeSingle(),
      sb.from('agent_alerts').select('*').eq('member_id', memberId).eq('read', false).order('created_at', { ascending: false }).limit(5),
    ]).then(([memberRes, scoreRes, presRes, briefRes, alertsRes]) => {
      if (memberRes.data) {
        setMemberName(memberRes.data.full_name ?? '')
        setMemberScore(memberRes.data.cortex_score ?? 0)
      }
      if (scoreRes.data) setScoreData(scoreRes.data as ScoreData)
      if (presRes.data) setPrescriptions(presRes.data as Prescription[])
      if (briefRes.data) setBrief(briefRes.data)
      if (alertsRes.data) setAlerts(alertsRes.data as AlertData[])
      setLoading(false)
    })
  }, [memberId])

  if (loading) return <Skeleton />

  return (
    <div>
      {/* Greeting */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-serif text-2xl text-t1 italic">{greeting(memberName)}</h1>
        <p className="font-sans text-xs text-t4 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Score ring + sub-scores */}
      <CortexScore score={memberScore} data={scoreData} />

      {/* Alertes agents */}
      <AlertsFeed alerts={alerts} />

      {/* Daily Brief */}
      <DailyBrief brief={brief} firstName={memberName} />

      {/* Prescriptions */}
      <PrescriptionTimeline initialPrescriptions={prescriptions} />

      {/* Experience drop */}
      <ExperienceDrop />
    </div>
  )
}
