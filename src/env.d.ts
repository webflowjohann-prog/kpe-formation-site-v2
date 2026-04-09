/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js'

declare namespace App {
  interface Locals {
    supabase: SupabaseClient
    user: User | null
    memberOnboarded: boolean
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_ANON_KEY: string
  readonly SUPABASE_SERVICE_ROLE_KEY: string
  readonly STRIPE_SECRET_KEY: string
  readonly STRIPE_WEBHOOK_SECRET: string
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  readonly STRIPE_CONNECT_CLIENT_ID: string
  readonly ANTHROPIC_API_KEY: string
  readonly TERRA_API_KEY: string
  readonly TERRA_DEV_ID: string
  readonly TERRA_WEBHOOK_SECRET: string
  readonly RESEND_API_KEY: string
  readonly PUBLIC_SITE_URL: string
  readonly PUBLIC_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
