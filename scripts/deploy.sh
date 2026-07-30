#!/usr/bin/env bash
# Build + deploy wonderland-site to Vercel production.
#
# Used by the cron after the archive has been synced.
# Assumes vercel CLI is logged in (token in env, or already-linked .vercel/).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "→ sync archive"
bash scripts/sync-archive.sh

echo "→ install"
pnpm install --frozen-lockfile

echo "→ build"
pnpm build

echo "→ deploy prod"
npx --yes vercel deploy --prod --yes --confirm

echo "✓ deployed"
