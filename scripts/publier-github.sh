#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  ZAWIYA NÎMES — Publication du code sur GitHub
#  Usage :
#    ./scripts/publier-github.sh <TOKEN> <UTILISATEUR> <DEPOT>
#
#  Exemple :
#    ./scripts/publier-github.sh ghp_AbCdEf1234567890 zawiya-nimes zawiya-nimes
#
#  Le token est retiré de la configuration git après le push
#  (il n'est jamais écrit dans un fichier suivi par git).
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage : $0 <TOKEN> <UTILISATEUR> <DEPOT>"
  echo "Exemple : $0 ghp_xxxxxxxxxxxx zawiya-nimes zawiya-nimes"
  exit 1
fi

TOKEN="$1"
USER="$2"
REPO="$3"
BRANCHE="$(git rev-parse --abbrev-ref HEAD)"

echo "→ Vérification de l'état du dépôt…"
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "⚠  Des changements non commités existent — je les commite automatiquement."
  git add -A
  git commit -m "Publication automatique avant push GitHub" || true
fi

echo "→ Connexion au dépôt github.com/${USER}/${REPO}…"
# Nettoyage d'un éventuel ancien remote
git remote remove origin 2>/dev/null || true
# Remote avec token (temporaire)
git remote add origin "https://${USER}:${TOKEN}@github.com/${USER}/${REPO}.git"

echo "→ Push de la branche ${BRANCHE} (premier envoi : cela peut prendre 1-2 min)…"
if git push -u "https://${USER}:${TOKEN}@github.com/${USER}/${REPO}.git" "${BRANCHE}" 2>&1 | sed "s/${TOKEN}/****/g"; then
  # On garde le remote SANS le token (propre)
  git remote set-url origin "https://github.com/${USER}/${REPO}.git"
  echo ""
  echo "✅ Code publié : https://github.com/${USER}/${REPO}"
  echo "🔒 Le token a été retiré de la configuration git locale."
  echo "   Pense à le révoquer quand tu ne l'utilises plus :"
  echo "   GitHub → Settings → Developer settings → Personal access tokens"
else
  echo ""
  echo "❌ Le push a échoué. Causes fréquentes :"
  echo "   1. Le token est expiré ou invalide"
  echo "   2. Le dépôt n'existe pas encore (crée-le VIDE sur github.com d'abord)"
  echo "   3. Le token n'a pas la permission 'repo' (contenu : lecture/écriture)"
  git remote remove origin 2>/dev/null || true
  exit 1
fi
