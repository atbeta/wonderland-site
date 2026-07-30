#!/usr/bin/env bash
# Build + deploy wonderland-site to Vercel production.
#
# Used by the cron after the archive has been synced.
# Requires VERCEL_TOKEN in env (or already-linked .vercel/).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN not set" >&2
  exit 1
fi

echo "→ sync archive"
bash scripts/sync-archive.sh

echo "→ install (skip native build scripts, pnpm 11+ default-deny is fine here)"
pnpm install --ignore-scripts

echo "→ build"
pnpm build

echo "→ deploy prod (token-auth, non-interactive)"
vercel deploy --prod --yes --token "$VERCEL_TOKEN"

echo "✓ deployed"
