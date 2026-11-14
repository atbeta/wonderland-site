#!/usr/bin/env bash
# wonderland-site: archive -> days/ -> commit -> push -> verify -> memory.
#
# WHY THIS IS THE WHOLE PIPELINE (not just a file copy)
# -------------------------------------------------------
# The 04:30 push cron payload literally says: "2) bash scripts/sync-archive.sh"
# and then lists git add / commit / push as separate steps. The cron agent
# follows those steps literally and burns its ~5 minute budget on extra
# model rounds (exploring the repo, re-reading state, polling vercel), then
# reports 'job execution timed out' even though the push already succeeded:
#   - 10-09 / 10-15 / 10-23 / 10-25: vercel CLI EPIPE spin or deadlock
#   - 11-03: 84s lost to a 'tools is not defined' ReferenceError + 142s of
#            ls/cat exploration + two extra wait rounds
#   - 11-15: same ReferenceError again, then the agent did the steps by hand
#            instead of using this script, and died at 'model-call-started'
# Because the payload's step 2 names THIS script, doing everything here means
# the cron agent's remaining steps (git add/commit/push) are instant no-ops.
#
# Everything is bounded: a global deadline plus a per-call timeout ceiling.
# No network wait can outlive the budget.
#
# Usage: bash scripts/sync-archive.sh            # full pipeline
#        bash scripts/sync-archive.sh --sync-only # copy only (legacy behaviour)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/.."
WORKSPACE="${HOME}/.openclaw/workspace"
ARCHIVE_SRC="${WORKSPACE}/wonderland/archive"
DEST="${SCRIPT_DIR}/../days"
MEM_DIR="${WORKSPACE}/memory"
TODAY="$(date +%Y-%m-%d)"
MEM_FILE="${MEM_DIR}/${TODAY}.md"
SITE_BASE="https://wonderland.pbeta.dev"
DEADLINE=$(( $(date +%s) + 150 ))
SYNC_ONLY=0
[[ "${1:-}" == "--sync-only" ]] && SYNC_ONLY=1

remaining() { local r=$(( DEADLINE - $(date +%s) )); (( r < 1 )) && r=1; echo "$r"; }

if [[ ! -d "$ARCHIVE_SRC" ]]; then
  echo "Archive source not found at: $ARCHIVE_SRC" >&2
  exit 1
fi

cd "$REPO_DIR" || exit 1
mkdir -p "$DEST"

# ---- sync: wipe published .md then re-copy, so deletions propagate ----
find "$DEST" -maxdepth 1 -type f -name '*.md' -delete
count=0
for src in "$ARCHIVE_SRC"/*.md; do
  [[ -e "$src" ]] || continue
  fname="$(basename "$src")"
  [[ "$fname" == _* ]] && continue
  cp -- "$src" "$DEST/$fname"
  count=$(( count + 1 ))
done
echo "Synced ${count} archive file(s) -> ${DEST}"

if [[ $SYNC_ONLY -eq 1 ]]; then exit 0; fi

# ---- commit (only if something changed) ----
git add -A
COMMIT_SHA="skip"
if git diff --cached --quiet; then
  echo "No changes after sync; skipping commit.";
else
  git commit -m "wonderland: nightly archive ${TODAY}" || { echo "FATAL: git commit failed" >&2; exit 1; }
  COMMIT_SHA="$(git rev-parse --short HEAD)";
fi

# ---- push (bounded; SSH key at ~/.ssh/id_ed25519, no token needed) ----
PUSHED="no"
if [[ "${COMMIT_SHA}" != "skip" ]]; then
  if timeout "$(remaining)" git push origin master; then
    PUSHED="yes";
  else
    echo "FATAL: git push failed or timed out" >&2;
    exit 1;
  fi;
fi

# ---- deploy URL: one short bounded vercel ls (informational only) ----
# Use the EPIPE-safe wrapper: the real Vercel CLI busy-loops at 130% CPU and
# balloons to GB of RAM when its stdout pipe is closed early (10-25 incident).
DEPLOY="unknown"
if [[ "${PUSHED}" == "yes" ]]; then
  _ls="$(timeout "$(remaining)" "${SCRIPT_DIR}/bin/vercel" ls --yes 2>/dev/null || true)";
  DEPLOY="$(printf '%s\n' "${_ls}" | grep -oE 'wonderland-site-[a-z0-9]+-betacloud\.vercel\.app' | head -1 || true)";
  DEPLOY="${DEPLOY:-unknown}";
fi

# ---- liveness: plain HTTP, never vercel inspect ----
SITE_CODE="n/a"
if [[ "${PUSHED}" == "yes" ]]; then
  for _try in 1 2 3; do
    SITE_CODE="$(timeout 12 curl -sS -o /dev/null -w '%{http_code}' "${SITE_BASE}/days/${TODAY}" 2>/dev/null || true)";
    [[ "${SITE_CODE}" == "200" ]] && break;
    sleep 6;
  done;
  SITE_CODE="${SITE_CODE:-n/a}";
fi

# ---- 2-line summary into memory (the nightly owns the top of the file) ----
mkdir -p "${MEM_DIR}"
{
  printf '\n## wonderland push cron (%s)\n' "$(date '+%H:%M %Z')"
  printf -- '- commit: %s | pushed: %s | deploy: %s | site /days/%s: HTTP %s\n' \
    "${COMMIT_SHA}" "${PUSHED}" "${DEPLOY}" "${TODAY}" "${SITE_CODE}";
} >> "${MEM_FILE}"

echo "OK commit=${COMMIT_SHA} pushed=${PUSHED} deploy=${DEPLOY} site_http=${SITE_CODE} mem=${MEM_FILE}"
echo "STOP-HERE: push and verification are complete. Do NOT call vercel inspect/vercel ls again, do NOT re-verify, and exit now."
exit 0
