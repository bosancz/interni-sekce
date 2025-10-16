#!/bin/bash -e

log_yellow() {
  echo -e "\033[1;33m$1\033[0m"
}

# Cleanup
log_yellow "Cleaning up..."

rm -fr ./node_modules
rm -fr ./frontend/node_modules
rm -fr ./backend/node_modules
rm -fr ./backend/dist
rm -fr ./frontend/dist

# Root
log_yellow "Installing root dependencies..."

npm ci

# Frontend
log_yellow "\n\nSetting up frontend..."

cd frontend
npm ci
cd ..

# Backend
log_yellow "\n\nSetting up backend..."

cd backend
npm ci
npm run build
npm run migrations:run
npm run cli create-admin
cd ..