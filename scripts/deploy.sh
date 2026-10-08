#!/usr/bin/env bash
# Plesk → Git → Additional deployment actions: bash scripts/deploy.sh
# Builds into dist-next, then swaps it in: a failed build exits before the swap,
# so the live build is never half-written and keeps serving.
set -euo pipefail
cd "$(dirname "$0")/.."

# Reinstall dependencies only when the lockfile changed: npm ci deletes node_modules
# first, and the running server may still need it
lock_hash=$( (sha256sum package-lock.json 2>/dev/null || shasum -a 256 package-lock.json) | cut -d' ' -f1)
if [ "$(cat node_modules/.deploy-lock-hash 2>/dev/null)" != "$lock_hash" ]; then
  npm ci
  echo "$lock_hash" > node_modules/.deploy-lock-hash
fi

rm -rf dist-next
ASTRO_OUT_DIR=dist-next npm run build    # astro.config.mjs reads outDir from ASTRO_OUT_DIR

rm -rf dist-prev
if [ -d dist ]; then mv dist dist-prev; fi
mv dist-next dist

# Passenger restarts the app on the next request
mkdir -p tmp
touch tmp/restart.txt
