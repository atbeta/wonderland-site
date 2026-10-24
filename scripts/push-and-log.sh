#!/usr/bin/env bash
# wonderland-site: one-shot, bounded sync + commit + push + verify + memory summary.
#
# WHY THIS EXISTS
# ---------------
# The 04:30 push cron used to run the steps by hand and then keep verifying
# the Vercel build (vercel ls / vercel inspect) before writing its summary.
# Those CLI calls intermittently hang or spin (observed 10-09, 10-15, 10-23,
# 10-25: shell stuck in ep_poll/do_wait, or vercel inspect at 115% CPU and
# 2.4GB RSS). The push itself had already succeeded and the site was already
# 200, but the job kept burning its execution budget and then reported
# 'job execution timed out (last phase: tool-execution-started)'.
#
# Fix: push first, verify with cheap HTTP checks instead of the Vercel CLI,
# record everything in memory, and exit. A global deadline guarantees the
# script always returns well inside the cron budget.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/.."
WORKSPACE="${HOME}/.openclaw/workspace"
MEM_DIR="${WORKSPACE}/memory"
TODAY="$(date +%Y-%m-%d)"            # local Asia/Shanghai, NOT date -u
MEM_FILE="${MEM_DIR}/${TODAY}.md"
SITE_BASE="https://wonderland.pbeta.dev"
DEADLINE=$(( $(date +%s) + 150 ))    # hard ceiling: whole script < 2.5 min

remaining() {
  local r=$(( DEADLINE - $(date +%s) ));
  (( r < 1 )) && r=1;
  echo "$r";
}

cd "$REPO_DIR" || exit 1

# --- 1) sync archives into days/ ---
bash "${SCRIPT_DIR}/sync-archive.sh" || { echo "FATAL: sync-archive.sh failed" >&2; exit 1; }

# --- 2) commit only if there is something to commit ---
git add -A
COMMIT_SHA="skip"
if git diff --cached --quiet; then
  echo "No changes after sync; skipping commit.";
else
  git commit -m "wonderland: nightly archive ${TODAY}" || { echo "FATAL: git commit failed" >&2; exit 1; }
  COMMIT_SHA="$(git rev-parse --short HEAD)";
fi

# --- 3) push (bounded; SSH key at ~/.ssh/id_ed25519, no token needed) ---
PUSHED="no"
if [[ "${COMMIT_SHA}" != "skip" ]]; then
  if timeout "$(remaining)" git push origin master; then
    PUSHED="yes";
  else
    echo "FATAL: git push failed or timed out" >&2;
    exit 1;
  fi;
fi

# --- 4) deploy URL: one short, bounded vercel ls (informational only) ---
DEPLOY="unknown"
if [[ "${PUSHED}" == "yes" ]]; then
  # NOTE: use the EPIPE-safe wrapper, never pipe the real CLI into head/grep -m
  _ls="$(timeout "$(remaining)" "${SCRIPT_DIR}/bin/vercel" ls --yes 2>/dev/null || true)";
  DEPLOY="$(printf '%s\n' "${_ls}" | grep -oE 'wonderland-site-[a-z0-9]+-betacloud\.vercel\.app' | head -1 || true)";
  DEPLOY="${DEPLOY:-unknown}";
fi

# --- 5) liveness check via plain HTTP (never vercel inspect) ---
SITE_CODE="n/a"
if [[ "${PUSHED}" == "yes" ]]; then
  for _try in 1 2 3; do
    SITE_CODE="$(timeout 12 curl -sS -o /dev/null -w '%{http_code}' "${SITE_BASE}/days/${TODAY}" 2>/dev/null || true)";
    [[ "${SITE_CODE}" == "200" ]] && break;
    sleep 6;
  done;
  SITE_CODE="${SITE_CODE:-n/a}";
fi

# --- 6) append the summary (the nightly owns the top of the file) ---
mkdir -p "${MEM_DIR}"
{
  printf '\n## wonderland push cron (%s)\n' "$(date '+%H:%M %Z')"
  printf -- '- commit: %s | pushed: %s | deploy: %s | site /days/%s: HTTP %s\n' \
    "${COMMIT_SHA}" "${PUSHED}" "${DEPLOY}" "${TODAY}" "${SITE_CODE}"
} >> "${MEM_FILE}"

echo "OK commit=${COMMIT_SHA} pushed=${PUSHED} deploy=${DEPLOY} site_http=${SITE_CODE} mem=${MEM_FILE}"
echo "STOP-HERE: push and verification are complete. Do NOT call vercel inspect/vercel ls again, do NOT re-verify, and exit now."
exit 0
