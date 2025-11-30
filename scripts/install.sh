#!/bin/bash -e

log_yellow() {
  echo -e "\033[1;33m$1\033[0m"
}

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