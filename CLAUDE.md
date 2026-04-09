# NATICS Lab — Blueprint Architecture Complète
# Document technique exhaustif pour Claude Code
# Chaque section est une spécification. Suivre dans l'ordre.

## STRUCTURE DU PROJET ASTRO

```
natics-lab/
├── CLAUDE.md
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── tsconfig.json
├── .env.example
├── netlify.toml
├── public/
│   ├── fonts/ (Playfair Display + DM Sans self-hosted)
│   ├── images/agents/ (hero B&W par agent .webp)
│   ├── images/founders/ (portraits B&W)
│   ├── manifest.json (PWA)
│   └── sw.js (Service Worker)
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro (shell HTML meta fonts)
│   │   ├── AppLayout.astro (auth required + tab bar)
│   │   └── PublicLayout.astro (landing + auth pages)
│   ├── middleware.ts (auth guard + onboarding check)
│   ├── components/
│   │   ├── ui/ (Glass Button Input ScoreRing MiniBar Modal TabBar AgentHeader PrescriptionCard BiomarkerPill ChatBubble)
│   │   ├── landing/ (Hero Concept AgentsGrid VideoSection Steps ScoreSection Partners Experiences Founders Pricing Footer)
│   │   ├── onboarding/ (OnboardingFlow QuestionScreen ProgressBar + questions.ts)
│   │   ├── dashboard/ (DashboardApp DailyBrief CortexScore PrescriptionTimeline AlertsFeed ExperienceDrop)
│   │   ├── agents/
│   │   │   ├── AgentChat.tsx (partagé)
│   │   │   ├── forge/ (Dashboard TrainingPlan SessionHistory RecoveryProtocols)
│   │   │   ├── morphee/ (Dashboard NightAnalysis EveningProtocol SleepHistory)
│   │   │   ├── fuel/ (Dashboard MealPlan SupplementList SupplementBundle MealScanner)
│   │   │   ├── zenith/ (Dashboard GuidedSessions StressJournal MentalProtocols)
│   │   │   ├── atlas/ (Dashboard ExperienceCatalog ExperienceDetail BiometricValidation PrepProtocol)
│   │   │   └── oracle/ (Dashboard BiomarkerGrid BiomarkerDetail ReportsView TrendsChart)
│   │   ├── scanner/ (CameraCapture ScanValidation)
│   │   ├── marketplace/ (ProductGrid ProductDetail Cart OrderHistory)
│   │   └── profile/ (ProfileView DeviceManager HealthQuestionnaire Settings)
│   ├── pages/
│   │   ├── index.astro (landing publique)
│   │   ├── auth/ (login register callback)
│   │   ├── onboarding.astro
│   │   ├── app/ (index agents/[agent] scanner marketplace/[productId] profile)
│   │   └── api/ (agents/chat scanner/ocr scanner/ocr/confirm stripe/checkout stripe/webhook stripe/portal terra/webhook scores/calculate)
│   ├── lib/
│   │   ├── supabase.ts (client browser + server)
│   │   ├── stripe.ts
│   │   ├── claude.ts
│   │   ├── terra.ts
│   │   ├── resend.ts
│   │   ├── score-calculator.ts
│   │   ├── ocr-processor.ts
│   │   ├── agent-prompts.ts
│   │   └── biomarker-matcher.ts
│   ├── stores/ (nanostores : auth member scores prescriptions cart chat)
│   └── styles/global.css
├── supabase/migrations/ (001 à 009)
└── scripts/ (seed-biomarkers import-ciqual test-terra-webhook)
```

## VARIABLES D'ENVIRONNEMENT

PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_CONNECT_CLIENT_ID
ANTHROPIC_API_KEY
TERRA_API_KEY, TERRA_DEV_ID, TERRA_WEBHOOK_SECRET
RESEND_API_KEY
PUBLIC_SITE_URL, PUBLIC_APP_NAME=NATICS Lab

## TAILWIND CONFIG

Couleurs : bg #0D0D0D, surface #1a1a1a, card #262626, border rgba(255,255,255,0.06), gold #c9a96e, gold-hover #b8963e, gold-glow rgba(201,169,110,0.18), t1 #ffffff, t2 #D9D9D9, t3 #A6A6A6, t4 #595959
Fonts : serif Playfair Display, sans DM Sans
Radius : card 20px, btn 12px
Blur : glass 24px
Shadow : glass 0 8px 32px rgba(0,0,0,0.4), glow 0 4px 20px rgba(201,169,110,0.25)

## AUTH FLOW

Inscription → Supabase Auth (email/magic link/OAuth) → Email confirmation Resend → Callback
→ Vérification onboarding_completed → NON: redirect /onboarding → OUI: redirect /app
Middleware protège toutes les routes /app/* et /onboarding

## API ROUTES

POST /api/agents/chat
  Input: { agent, message }
  Process: récup profil + biomarqueurs + métriques + prescriptions + historique conv → build system prompt → Claude API → save conv → si prescription: insert agent_prescriptions
  Output: { response, prescriptions? }

POST /api/scanner/ocr
  Input: { image: base64 }
  Process: Claude Vision extraction → fuzzy match biomarker_knowledge → retour pour validation
  Output: { results: [{name, value, unit, matched_biomarker_id, confidence}] }

POST /api/scanner/ocr/confirm
  Input: { results: [{biomarker_id, value, unit}] }
  Process: insert biomarker_results → recalcul score → notif agents
  Output: { inserted, new_score }

POST /api/stripe/checkout
  Input: { plan? | products?: [{product_id, quantity}] }
  Process: Stripe Checkout Session (subscription ou payment avec Connect)
  Output: { checkout_url }

POST /api/stripe/webhook
  Events: checkout.session.completed → update member.plan | invoice.paid → log orders | subscription.deleted → downgrade

POST /api/terra/webhook
  Process: identify member via terra_user_id → parse data → upsert daily_metrics → update last_sync → recalcul score

POST /api/scores/calculate
  Process: daily_metrics 7j + biomarker_results + member_compliance 30j → sous-scores (sleep*0.25 + recovery*0.20 + activity*0.20 + biomarker*0.20 + compliance*0.15) → level → insert cortex_scores → update members.cortex_score

## SYSTEM PROMPTS AGENTS

Préfixe commun : identité agent + profil membre complet + biomarqueurs récents + métriques wearable 7j + prescriptions actives + médicaments déclarés + règles (pas diagnostic, consulter médecin, vérifier interactions ANSM, partenaires référencés, citer sources, ton pro sans emoji, prescriptions en JSON)

FORGE : entraînement méthode IMPACT/FLOW/VISION, adapte intensité au HRV/cortisol/testostérone
MORPHÉE : sommeil cycles, prescrit routines soir, ajuste selon latence endormissement deep sleep
FUEL : nutrition suppléments, vérifie interactions ANSM, bundles compléments, plans repas calibrés biomarqueurs
ZÉNITH : mental, breathwork méditation cohérence cardiaque, monitore stress via HRV
ATLAS : expériences, éligibilité biométrique, protocoles préparation pré-expédition
ORACLE : coordinateur, score global, rapports (daily brief weekly monthly), tendances

## DATA PIPELINES

1. Onboarding : inscription → 65 questions → sauvegarde progressive → compilation profil → score initial → daily brief
2. Wearable quotidien : device → Terra → webhook → daily_metrics → recalcul score → Realtime → dashboard → agents adaptent
3. Scanner OCR : caméra → Claude Vision → matching → validation membre → biomarker_results → recalcul → alertes
4. Boutique : FUEL prescrit bundle → membre modifie panier → Stripe Checkout Connect → partner_orders → commission
5. Expériences : drop ATLAS → pré-réservation → Stripe → booking → quota atteint? → confirmé ou remboursé
6. Chat agent : message → contexte complet → Claude API → réponse → prescription? → insert → notification push
7. Score quotidien : cron 7h n8n → calculate pour chaque membre → ORACLE daily brief → push notification

## SPRINTS DE BUILD (ordre strict)

Sprint 0 (1-2j) : init Astro React Tailwind Supabase, layouts, composants UI base, fonts, global.css
Sprint 1 (3-4j) : landing page Astro + auth Supabase + middleware + pages login/register
Sprint 2 (3-4j) : onboarding 65 questions Typeform-style connecté Supabase
Sprint 3 (3-4j) : dashboard Home score ring daily brief prescriptions timeline tab bar
Sprint 4 (5-6j) : agent FUEL + marketplace + Stripe Connect + panier bundles
Sprint 5 (4-5j) : agent MORPHÉE + scanner OCR Claude Vision
Sprint 6 (3-4j) : Terra API wearable sync + score calculator + cron
Sprint 7 (4-5j) : agents FORGE + ZÉNITH
Sprint 8 (3-4j) : agent ATLAS + expériences pré-réservation quota
Sprint 9 (3-4j) : agent ORACLE + rapports + biomarqueurs détail
Sprint 10 (3-4j) : PWA push notifications questionnaire mensuel polish

## SÉCURITÉ

- Clés secrètes JAMAIS côté client (uniquement PUBLIC_*)
- Stripe/Terra webhooks : vérifier signature
- RLS sur chaque table
- Rate limiting 60 req/min/user
- Sanitization inputs
- CORS domaine uniquement
- RGPD : consentement explicite, export données, suppression sur demande

## EXTENSIBILITÉ

- Nouveau wearable → mapping Terra (pas de migration)
- Nouveau biomarqueur → insert biomarker_knowledge
- Nouveau partenaire → insert partners + products
- Nouvel agent → prompt + page (agent_conversations accepte tout agent TEXT)
- App native → composants React portables vers React Native
- HDS → migration URLs .env uniquement
- Business → role admin_enterprise + dashboard dédié
- Multilingue → textes dans composants pas dans layouts
