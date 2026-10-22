#!/usr/bin/env bash
# wonderland-site: one-shot, bounded sync + commit + push + memory summary.
#
# WHY THIS EXISTS
# ---------------
# The 04:30 push cron used to run the steps by hand and then poll
# \`vercel ls --yes\` waiting for the build to report Ready before writing the
# memory summary. The Vercel CLI intermittently deadlocks on that poll
# (observed 10-09, 10-15, 10-23: shell stuck in ep_poll/do_wait, 0% CPU,
# commit + push already done, site already 200). The cron job then hit its
# execution timeout even though the deploy had succeeded.
#
# Fix: push FIRST, record the summary with a hard-bounded poll, never block.
# Every network wait in here has an explicit \`timeout\` ceiling.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/.."
WORKSPACE="${HOME}/.openclaw/workspace"
MEM_DIR="${WORKSPACE}/memory"
TODAY="$(date +%Y-%m-%d)"          # local Asia/Shanghai, NOT `date -u\`
MEM_FILE="${MEM_DIR}/${TODAY}.md"
VERCEL_POLL_TIMEOUT=25              # seconds; hard ceiling on the only vercel call
GIT_PUSH_TIMEOUT=120

cd "$REPO_DIR" || exit 1

# --- 1) sync archives into days/ ---
bash "${SCRIPT_DIR}/sync-archive.sh" || { echo "FATAL: sync-archive.sh failed" >&2; exit 1; }

# --- 2) commit only if there is something to commit ---
git add -A
COMMIT_SHA="skip"
COMMIT_MSG="wonderland: nightly archive ${TODAY}"
if git diff --cached --quiet; then
  echo "No changes after sync; skipping commit."
else
  git commit -m "${COMMIT_MSG}" || { echo "FATAL: git commit failed" >&2; exit 1; }
  COMMIT_SHA="$(git rev-parse --short HEAD)"
fi

# --- 3) push (bounded; SSH key at ~/.ssh/id_ed25519, no token needed) ---
PUSHED="no"
if [[ "${COMMIT_SHA}" != "skip" ]]; then
  if timeout "${GIT_PUSH_TIMEOUT}" git push origin master; then
    PUSHED="yes"
  else
    echo "FATAL: git push failed (or timed out after ${GIT_PUSH_TIMEOUT}s)" >&2
    exit 1
  fi
fi

# --- 4) bounded deploy lookup, purely informational ---
# Never let this hang the job. A miss here must not fail the push.
DEPLOY="unknown"
if [[ "${PUSHED}" == "yes" ]]; then
  _ls="$(timeout "${VERCEL_POLL_TIMEOUT}" vercel ls --yes 2>/dev/null || true)"
  DEPLOY="$(printf '%s\n' "${_ls}" | grep -oE 'wonderland-site-[a-z0-9]+-betacloud\.vercel\.app' | head -1 || true)"
  DEPLOY="${DEPLOY:-unknown}"
fi

# --- 5) append the 2-line summary (nightly owns the top of the file) ---
mkdir -p "${MEM_DIR}"
{
  printf '\n## wonderland push cron (%s)\n' "$(date '+%H:%M %Z')"
  printf -- '- commit: %s | pushed: %s | deploy: %s\n' \
    "${COMMIT_SHA}" "${PUSHED}" "${DEPLOY}"
} >> "${MEM_FILE}"

echo "OK commit=${COMMIT_SHA} pushed=${PUSHED} deploy=${DEPLOY} mem=${MEM_FILE}"
exit 0
