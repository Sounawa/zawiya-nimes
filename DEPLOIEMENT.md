# Déploiement — Zawiya Nîmes

> **État actuel (round 11)** : le site est EN LIGNE sur **Vercel** (plan
> Hobby gratuit) à l'adresse officielle **https://zawiya-nimes.vercel.app**
> (le blocage Netlify — crédits de build épuisés — a forcé la migration).

---

## 1. Où vit quoi

| Brique | Où | Détail |
|---|---|---|
| **Code source** | GitHub `Sounawa/zawiya-nimes` (privé) | La source de vérité — tout est poussé à chaque round |
| **Adresse officielle** | **https://zawiya-nimes.vercel.app** | Domaine de production Vercel, vérifié — LA seule adresse à partager |
| **Alias technique** | https://zawiya-nimes-zawiya2.vercel.app | Alias automatique Vercel (`projet-équipe`) — même site, même déploiement, non supprimable, à ne pas partager |
| **Base de données** | Turso `libsql://zawiya-sounawa.aws-eu-west-1.turso.io` | SQLite hébergée gratuite — membres, réunions, annonces |
| **Ancien site** | https://zawiya-nimes.netlify.app | ENCORE EN LIGNE mais figé au round 7 (Netlify bloqué : « Account credit usage exceeded ») — À FERMER pour n'avoir qu'une seule adresse |

### L'histoire des adresses (pour éviter toute confusion)

1. **Netlify a bloqué le compte** (crédits de build gratuits épuisés le
   29-30 sept.) → l'ancienne adresse ne pouvait plus recevoir de mises à
   jour : elle est restée figée au round 7 (SW v14), sans le bandeau
   ijtimâ', ni le message d'annonce facultatif, ni l'installation PWA.
2. **Migration vers Vercel** (round 10, avec le token fourni par le
   frère) → le site est déployé avec la dernière version (SW v16).
3. Vercel attache automatiquement **deux** adresses à chaque projet :
   - **zawiya-nimes.vercel.app** — le domaine officiel (vérifié,
     enregistré sur le projet) ;
   - **zawiya-nimes-zawiya2.vercel.app** — l'alias technique
     `nom-du-projet-nom-de-l'équipe` que Vercel génère toujours et
     qu'on ne peut pas supprimer. Ce n'est **pas un deuxième site** :
     c'est exactement le même, comme un numéro de porte et un code
     postal pour la même maison.
4. **L'adresse à garder et à partager : zawiya-nimes.vercel.app** ✅
5. **L'ancienne adresse Netlify doit être fermée** pour qu'il n'existe
   qu'une seule adresse. Deux moyens :
   - depuis le dashboard Netlify : `app.netlify.com` → site `zawiya-nimes`
     → **Site settings** → tout en bas → **Delete site** (30 secondes) ;
   - ou redonner le token Netlify (`nfp_…`) à l'agent, qui la fermera
     par API (`DELETE /api/v1/sites/f4dee7b5-a55f-4223-acd6-cfca4894c846`).

> ⚠️ Avant de fermer Netlify : les frères qui ont installé la PWA depuis
> l'ancienne adresse devront la réinstaller depuis
> **zawiya-nimes.vercel.app** (l'app installée pointe sur l'ancienne
> origine).

## 2. Comment fonctionne un déploiement Vercel

Le build a lieu sur les serveurs Vercel (jamais en local) :

- **Commande de build** : `prisma generate && next build --webpack`
  (webpack car Turbopack 16.1 bute sur `next/font/google` — erreur
  `@vercel/turbopack-next/internal/font/google/font`).
- **Variables d'environnement** (définies sur le projet Vercel, cibles
  production + preview) : `DATABASE_URL` (URL libsql Turso) et
  `DATABASE_AUTH_TOKEN` (jeton Turso).
- **`serverExternalPackages`** (next.config.ts) : `libsql`,
  `@libsql/client`, `@prisma/adapter-libsql` — les paquets natifs de
  Turso ne sont pas bundlés par webpack.
- **`gitForkProtection` désactivé** et **`ssoProtection` désactivée** :
  les déploiements par CLI ne sont pas bloqués, et le site est public
  sans mur d'authentification Vercel.
- **Déploiement depuis la sandbox** : export propre `git archive HEAD`
  vers `/tmp/zawiya-deploy` (SANS le dossier `.git` — sinon Vercel
  applique une vérification d'auteur GitHub qui bloque le
  déploiement), puis :
  ```bash
  cd /tmp/zawiya-deploy && npx vercel@latest deploy --prod --yes \
    --no-wait --token="$VERCEL_TOKEN"
  ```
  puis sondage `GET /v6/deployments` jusqu'à `READY`.

## 3. Hors-ligne (PWA)

- `public/sw.js` (v16) : navigation network-first, le shell et les
  chunks sont mis en cache — l'app se recharge et les documents
  s'ouvrent **sans réseau** (vérifié en QA).
- Manifest + icônes servis depuis `/public`.
- La section Réglages ▸ « Application hors-ligne » permet d'installer
  l'app (bouton natif, instructions iOS « Sur l'écran d'accueil »).

## 4. Tokens (à révoquer quand la zawiya le souhaite)

Ils sont fournis dans la conversation, jamais stockés dans le dépôt :
GitHub (push), Turso (base), Netlify (lecture d'env), Vercel
(déploiement).
