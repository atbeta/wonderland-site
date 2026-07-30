#!/usr/bin/env bash
# Sync wonderland/archive/*.md → wonderland-site/src/content/days/
#
# Run from anywhere. The archive source is the live wonderland workspace;
# this script treats that as the single source of truth.
# Prunes files in dest that no longer exist in source (e.g. deleted runs).

set -euo pipefail

WORKSPACE="${HOME}/.openclaw/workspace"
ARCHIVE_SRC="${WORKSPACE}/wonderland/archive"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${SCRIPT_DIR}/../days"

if [[ ! -d "$ARCHIVE_SRC" ]]; then
  echo "Archive source not found at: $ARCHIVE_SRC" >&2
  exit 1
fi

mkdir -p "$DEST"

# Wipe current published .md files before re-copying, so deletions propagate.
find "$DEST" -maxdepth 1 -type f -name '*.md' -delete

count=0
for src in "$ARCHIVE_SRC"/*.md; do
  [[ -e "$src" ]] || continue                       # guard against no-match
  fname="$(basename "$src")"
  [[ "$fname" == _* ]] && continue                  # skip helpers
  cp -- "$src" "$DEST/$fname"
  count=$(( count + 1 ))
done

echo "Synced ${count} archive file(s) → ${DEST}"
