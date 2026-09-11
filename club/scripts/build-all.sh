#!/usr/bin/env bash
#
# Builds both front ends and places them where the API server serves them from.
#
# This step used to be manual: build each app, then copy the output into the
# backend directory by hand. Forgetting it is how a stale admin bundle reaches
# production, so it is a script and part of the deploy.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "Installing dependencies"
npm --prefix backend ci --no-audit --no-fund 2>/dev/null || npm --prefix backend install --no-audit --no-fund
npm --prefix admin ci --no-audit --no-fund 2>/dev/null || npm --prefix admin install --no-audit --no-fund
npm --prefix user/connect-share ci --no-audit --no-fund 2>/dev/null || npm --prefix user/connect-share install --no-audit --no-fund

step "Type-checking"
npm --prefix backend run typecheck
npx --prefix admin tsc --noEmit -p admin/tsconfig.app.json
npx --prefix user/connect-share tsc --noEmit -p user/connect-share/tsconfig.app.json

step "Building the admin dashboard"
npm --prefix admin run build

step "Building the member app"
npm --prefix user/connect-share run build

step "Compiling the API"
npm --prefix backend run build

step "Publishing front-end builds into the API server"
rm -rf backend/admin_build backend/user_build
cp -R admin/dist backend/admin_build
cp -R user/connect-share/dist backend/user_build

# The compiled server runs from dist/, and resolves the SPA builds relative to
# its own directory, so they have to sit alongside it.
rm -rf backend/dist/admin_build backend/dist/user_build
cp -R backend/admin_build backend/dist/admin_build
cp -R backend/user_build backend/dist/user_build

step "Done"
echo "Start the server with:  npm --prefix backend start"
