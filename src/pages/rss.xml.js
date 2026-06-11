// Flux RSS du blog KPE — signal de fraîcheur pour Google et lecteurs RSS
// Ajouter chaque nouvel article à ce tableau lors de sa publication.

const SITE = 'https://formation-kinesiologie.com';

const articles = [
  { slug: "5-raisons-se-former-kpe", title: "5 raisons de se former à la KPE plutôt qu'à une autre méthode", description: "Pourquoi choisir la formation KPE en kinésiologie ? Méthode complète, prix accessible, accompagnement personnalisé, résultats prouvés.", date: "2026-03-10" },
  { slug: "14-meridiens-emotions-kinesiologie", title: "Les 14 méridiens et leurs émotions en kinésiologie", description: "Les 14 méridiens de la médecine chinoise et leurs émotions associées. Comprendre le lien énergie-organes-émotions.", date: "2026-03-06" },
  { slug: "devenir-kinesiologue-formation-salaire-debouches", title: "Comment devenir praticien en kinésiologie psycho-énergétique", description: "Formation, salaire moyen, débouchés, installation. Guide complet pour votre reconversion.", date: "2026-03-06" },
  { slug: "formation-kinesiologie-en-ligne-vs-presentiel", title: "Formation kinésiologie en ligne vs présentiel : comment choisir ?", description: "Faut-il choisir une formation en kinésiologie en ligne ou en présentiel ? Comparatif des deux formats.", date: "2026-03-06" },
  { slug: "kinesiologie-enfants-apprentissage-brain-gym", title: "Kinésiologie et enfants : Brain Gym, apprentissage et gestion des émotions", description: "Comment la kinésiologie aide les enfants en difficulté d'apprentissage.", date: "2026-03-06" },
  { slug: "kinesiologie-psycho-energetique-guide-complet", title: "Qu'est-ce que la kinésiologie psycho-énergétique ? Le guide complet", description: "La KPE : méthode holistique unique reliant corps, énergie et psyché. Origines, principes, bienfaits.", date: "2026-03-06" },
  { slug: "kinesiologie-stress-anxiete-liberation-emotionnelle", title: "Kinésiologie et stress : comment libérer les tensions émotionnelles", description: "Techniques de libération émotionnelle pour retrouver la sérénité.", date: "2026-03-06" },
  { slug: "meridien-foie-colere-lien-corps-emotion", title: "Méridien du Foie et colère : comprendre le lien corps-émotion", description: "Le méridien du Foie et son lien avec la colère en kinésiologie.", date: "2026-03-06" },
  { slug: "reconversion-professionnelle-kinesiologie", title: "Reconversion professionnelle : pourquoi choisir la kinésiologie ?", description: "Parcours, formation, installation — tout pour réussir votre changement de vie.", date: "2026-03-06" },
  { slug: "sinstaller-kinesiologue-guide-pratique", title: "S'installer en kinésiologie psycho-énergétique : le guide pratique en 2026", description: "Statut juridique, assurance, cabinet, création de clientèle.", date: "2026-03-06" },
  { slug: "test-musculaire-kinesiologie-comment-ca-marche", title: "Le test musculaire en kinésiologie : comment ça marche ?", description: "Principe, déroulement, interprétation. L'outil fondamental du kinésiologue.", date: "2026-03-06" },
  { slug: "kinesiologie-gestion-stress-equilibre", title: "Kinésiologie et gestion du stress : retrouver l'équilibre", description: "Techniques de libération émotionnelle, rééquilibrage énergétique et bienfaits concrets.", date: "2026-03-04" },
  { slug: "quest-ce-que-la-kinesiologie-psycho-energetique", title: "Qu'est-ce que la Kinésiologie Psycho-Énergétique ?", description: "Une méthode unique qui relie corps, énergie et psyché.", date: "2026-03-01" },
];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
  const items = articles
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(a => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE}/blog/${a.slug}/</link>
      <guid isPermaLink="true">${SITE}/blog/${a.slug}/</guid>
      <description>${escapeXml(a.description)}</description>
      <author>contact@formation-kinesiologie.com (Joël Prieur)</author>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog KPE — Kinésiologie Psycho-Énergétique</title>
    <link>${SITE}/blog</link>
    <description>Articles sur la kinésiologie psycho-énergétique par Joël Prieur, créateur de la méthode KPE : test musculaire, méridiens, reconversion, installation professionnelle.</description>
    <language>fr-FR</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
