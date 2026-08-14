
## FRONTEND BUILD ##
FROM node:24-alpine AS build-frontend

ARG NG_CONFIGURATION=production
ARG VERSION

WORKDIR /app/frontend

# install dependencies
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# build
COPY ./frontend .
ENV VERSION=$VERSION
RUN npm run build



## BACKEND BUILD ##
FROM node:24-alpine AS build-backend

WORKDIR /app/backend

# Puppeteer bundles a glibc Chromium that can't run on Alpine; use the system one instead (installed in the runner).
ENV PUPPETEER_SKIP_DOWNLOAD=true

# install dependencies
COPY ./backend/package.json ./backend/package-lock.json ./
RUN npm ci

# build
COPY ./backend .
RUN npm run build

# cleanup
RUN npm prune --omit=dev



## RUNNER ##
FROM node:24-alpine

ARG VERSION

# Chromium used by Puppeteer to render registration PDFs from HTML templates.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# copy backend files
COPY --from=build-backend /app/backend/node_modules /app/backend/node_modules
COPY --from=build-backend /app/backend/dist /app/backend/dist
COPY --from=build-backend /app/backend/assets /app/backend/assets
COPY --from=build-backend /app/backend/package.json /app/backend/

# copy frontend files
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# changelog served at GET /api/changelog (see ChangelogService); path resolves via config.app.changelogPath
COPY CHANGELOG.md /app/CHANGELOG.md

# run
WORKDIR /app/backend

ENV NODE_ENV=production
ENV VERSION=$VERSION
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD [ "npm","start" ]
