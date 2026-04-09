import { createHmac, timingSafeEqual } from 'node:crypto'

const TERRA_BASE = 'https://api.tryterra.co/v2'

function terraHeaders() {
  return {
    'Content-Type': 'application/json',
    'dev-id': import.meta.env.TERRA_DEV_ID as string,
    'x-api-key': import.meta.env.TERRA_API_KEY as string,
  }
}

/** Génère une session widget pour connecter un appareil */
export async function generateWidgetSession(referenceId: string): Promise<{
  url: string
  session_id: string
  expires_in: number
}> {
  const res = await fetch(`${TERRA_BASE}/auth/generateWidgetSession`, {
    method: 'POST',
    headers: terraHeaders(),
    body: JSON.stringify({
      reference_id: referenceId,
      providers: 'GARMIN,POLAR,WAHOO,WHOOP,OURA,APPLE,WITHINGS,SAMSUNG,SUUNTO,COROS',
      language: 'fr',
      redirect_url: `${import.meta.env.PUBLIC_SITE_URL}/app/profile?terra=connected`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Terra widget session error ${res.status}: ${err}`)
  }

  return res.json()
}

/** Déconnecte un utilisateur Terra */
export async function deauthenticateUser(terraUserId: string): Promise<void> {
  await fetch(`${TERRA_BASE}/auth/deauthenticateUser?user_id=${encodeURIComponent(terraUserId)}`, {
    method: 'DELETE',
    headers: terraHeaders(),
  })
}

/** Vérifie la signature HMAC d'un webhook Terra */
export function verifyTerraSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = import.meta.env.TERRA_WEBHOOK_SECRET as string
  if (!secret) return false

  const computed = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

/** Types Terra webhook */
export interface TerraWebhookPayload {
  type: string
  user: {
    user_id: string
    provider: string
    last_webhook_update: string
  }
  data?: TerraActivityData[] | TerraSleepData[] | TerraBodyData[] | TerraDailyData[]
}

export interface TerraActivityData {
  metadata: { start_time: string; end_time: string }
  calories_data?: { total_burned_calories: number; active_calories: number }
  distance_data?: { summary?: { steps: number; distance_meters: number }; detailed?: unknown }
  active_durations_data?: { activity_seconds: number }
  heart_rate_data?: { summary?: { resting_hr_bpm: number; avg_hrv_rmssd: number } }
}

export interface TerraSleepData {
  metadata: { start_time: string; end_time: string }
  sleep_durations_data?: {
    sleep_efficiency?: number
    asleep_durations?: {
      duration_light_sleep_state_seconds?: number
      duration_REM_sleep_state_seconds?: number
      duration_deep_sleep_state_seconds?: number
    }
  }
  heart_rate_data?: { summary?: { resting_hr_bpm?: number; min_hr_bpm?: number } }
  hrv_data?: { summary?: { rmssd_sample_mean_ms?: number } }
  oxygen_data?: { avg_saturation_percentage?: number }
}

export interface TerraBodyData {
  metadata: { start_time: string }
  heart_rate_data?: { summary?: { resting_hr_bpm?: number } }
  hrv_data?: { summary?: { rmssd_sample_mean_ms?: number } }
  oxygen_data?: { avg_saturation_percentage?: number }
}

export interface TerraDailyData {
  metadata: { start_time: string }
  steps_data?: { steps?: number }
  calories_data?: { total_burned_calories?: number; net_activity_calories?: number }
  active_durations_data?: { activity_seconds?: number }
  distance_data?: { summary?: { distance_meters?: number } }
}
