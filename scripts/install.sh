#!/bin/bash -e

log_yellow() {
  echo -e "\033[1;33m$1\033[0m"
}

# Install all workspaces (frontend + backend) and root tooling (turbo).
# --ignore-scripts avoids recursively re-triggering this "install" lifecycle script.
log_yellow "\n\nInstalling dependencies..."
npm ci --ignore-scripts

# Backend build & migrations
log_yellow "\n\nSetting up backend..."

cd backend
npm run build
npm run migrations:run
cd ..
