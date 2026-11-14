#!/usr/bin/env bash
# Thin wrapper: the pipeline now lives in sync-archive.sh (which is also the file
# the 04:30 push cron payload names in its step 2). Kept as an alias so both
# entry points behave identically.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "${SCRIPT_DIR}/sync-archive.sh" "$@"
