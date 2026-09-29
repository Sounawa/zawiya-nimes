/* ─── Service worker de la Zawiya Nîmes ──────────────────────────────
   Objectif : l'application reste ouvrable hors-ligne (app-shell)
   et ne consomme quasi rien en ligne :
   — navigation (HTML)  : réseau d'abord (quelques Ko), coquille en secours
   — /api/*             : réseau seul (données de communauté toujours fraîches)
   — immuables (build)  : cache d'abord, jamais re-téléchargés en arrière-plan
   — autres statiques   : stale-while-revalidate
   Cache versionné — toute nouvelle version purge l'ancienne.
   ⚠ Changer une image (logo, tariqa…) exige de bumper VERSION. */

const VERSION = 'zawiya-v11'
const SHELL = [
  '/favicon-96.png',
  '/apple-touch-icon.png',
  '/icone-192.png',
  '/icone-512.png',
  '/tariqa.png',
  '/manifest.webmanifest',
]

/* ─── Installation : pré-cache des éléments stables ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) =>
        Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
      )
      .then(() => self.skipWaiting())
  )
})

/* ─── Activation : purge des caches obsolètes ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  )
})

/* ─── Interception des requêtes ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  /* Le badge Netlify (HUD) ne part pas avec la data des frères :
     son script ne charge jamais — la page porte déjà le piège
     #nl-hud-frame qui l'empêche de s'afficher. */
  if (url.pathname.startsWith('/.netlify/scripts/hud')) {
    event.respondWith(new Response('', { status: 204 }))
    return
  }

  /* Données de la communauté : réseau seul, jamais de cache */
  if (url.pathname.startsWith('/api/')) return

  /* Navigation : réseau d'abord, coquille en secours */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((reponse) => {
          const copie = reponse.clone()
          caches.open(VERSION).then((cache) => cache.put('/', copie)).catch(() => {})
          return reponse
        })
        .catch(() =>
          caches
            .match(request)
            .then((enCache) => enCache ?? caches.match('/'))
            .then(
              (enCache) =>
                enCache ??
                new Response(
                  "<!doctype html><meta charset=utf-8><title>Hors-ligne</title><p style=\"font-family:system-ui;padding:2rem;text-align:center\">La zawiya n'est pas encore en cache — reconnecte-toi une fois en ligne ✦</p>",
                  { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                )
            )
        )
    )
    return
  }

  /* Immuables — chunks du build (noms hachés : un nouveau déploiement
     = nouveaux noms = téléchargement naturel) et coquille pré-cachée.
     Servis depuis le cache SANS re-téléchargement en arrière-plan :
     c'est ce qui protège la data des frères. */
  const estImmutable =
    url.pathname.startsWith('/_next/static/') || SHELL.includes(url.pathname)
  if (estImmutable) {
    event.respondWith(
      caches.match(request).then(
        (enCache) =>
          enCache ??
          fetch(request).then((reponse) => {
            if (reponse.ok) {
              const copie = reponse.clone()
              caches
                .open(VERSION)
                .then((cache) => cache.put(request, copie))
                .catch(() => {})
            }
            return reponse
          })
      )
    )
    return
  }

  /* Autres statiques (polices locales, images de contenu…) : SWR */
  const estStatique = /\.(png|svg|ico|webmanifest|woff2?|jpg|webp)$/.test(url.pathname)
  if (!estStatique) return

  event.respondWith(
    caches.match(request).then((enCache) => {
      const reseau = fetch(request)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copie)).catch(() => {})
          }
          return reponse
        })
        .catch(() => enCache)
      return enCache ?? reseau
    })
  )
})
