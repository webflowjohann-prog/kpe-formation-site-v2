# JOURNAL — NATICS Lab

---

## 2026-06-12 — Typographie Montserrat + Intégration logo losange

### Ce qui a été fait

**Typographie globale**
- Suppression complète de Playfair Display et DM Sans (@font-face + tokens + toutes les références inline)
- Installation `@fontsource-variable/montserrat` (npm) — graisses 400→700 + italiques via variable font
- `@theme` mis à jour : `--font-display`, `--font-body`, `--font-serif`, `--font-sans` → tous Montserrat Variable
- `@layer base` : hiérarchie h1 (700, -0.02em, lh 1.05) / h2 (600, -0.015em, lh 1.1) / h3 (600, -0.01em)
- `tabular-nums` activé sur `.score-text` et `[data-counter]` — stabilise les chiffres animés
- Boutons `.btn-gold` et `.btn-outline` : uppercase + tracking +0.08em
- Labels `.label` : uppercase + tracking +0.12em (style Temple)
- Grep confirmé : zéro résidu Playfair / DM Sans / Inter Tight dans le codebase

**Logos**
- Répertoire `public/images/logo/` créé — attend les 4 PNG de Johann
- Header PublicLayout : logo image + swap scroll (plein → noir après 80px)
- Header AppLayout : logo image (plein, h24px)
- Hero.astro : logo image (plein, h36px)
- Footer.astro : logo image zone identité (plein, h32px) — watermark texte conservé
- Auth pages (login/register) : logo image
- Composant `src/components/ui/LogoDivider.astro` créé (losange 90px + lignes séparateurs)
- `LogoDivider` inséré dans `index.astro` entre HowItWorks et Pricing
- Classe `.photo-stamp` ajoutée dans global.css (cachet coin bas-droit, 64px, opacity 0.65)
- Favicon : référence PNG logo ajoutée dans BaseLayout + apple-touch-icon

**Build** : ✅ `npm run build` — zéro erreur

---

### À VALIDER par Johann

1. **Logos PNG à placer** : déposer les 4 fichiers dans `public/images/logo/`
   - `logo-natics-blanc.png` — losange blanc (fonds sombres)
   - `logo-natics-noir.png` — losange noir trait (fonds blancs, discret)
   - `logo-natics-plein.png` — losange noir rempli + texte blanc (officiel fond blanc)
   - `logo-natics-or.png` — version dorée #B8945A (accent ponctuel)
   - Ratio natif attendu : 1214×608 (≈2:1) — ne pas déformer
   - Une fois déposés : swap scroll header sera actif, LogoDivider s'affichera, etc.

2. **Swap header scroll** : régler le seuil (actuellement 80px) si besoin, et comparer plein vs noir à la hauteur h28px du header.

3. **Tampons photo (photo-stamp)** : la classe `.photo-stamp` est prête dans global.css. À appliquer sur les conteneurs de photos N&B pleine largeur (photo parallaxe Dolomites, hero /studio, pleine largeur /entreprises) quand ces sections seront buildées.

4. **Logo or** : `logo-natics-or.png` réservé à `/contact` (form) et card Programme Signature. Page `/contact` non encore créée.

5. **LogoDivider** aux emplacements `/methode` et `/studio` : pages non encore créées — à insérer lors du build de ces pages.

6. **Favicon.ico** : régénérer à partir du losange (version pleine 256×256 ou SVG → ICO). Actuellement l'ICO existant est conservé en fallback.

7. **Validation visuelle** : passer en revue home + agents + dashboard + marketplace après dépôt des logos.
