#!/usr/bin/env bash
# Plesk → Git → Additional deployment actions: bash scripts/deploy.sh
# Builds into dist-next, then swaps it in: a failed build exits before the swap,
# so the live build is never half-written and keeps serving.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
rm -rf dist-next
ASTRO_OUT_DIR=dist-next npm run build    # astro.config.mjs reads outDir from ASTRO_OUT_DIR

rm -rf dist-prev
if [ -d dist ]; then mv dist dist-prev; fi
mv dist-next dist

# Passenger restarts the app on the next request
mkdir -p tmp
touch tmp/restart.txt
