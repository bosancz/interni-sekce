
## FRONTEND BUILD ##
FROM node:20-alpine AS build-frontend

ARG NG_CONFIGURATION=production

WORKDIR /app/frontend

# install dependencies
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# build
COPY ./frontend .
RUN npm run build



## BACKEND BUILD ##
FROM node:20-alpine AS build-backend

WORKDIR /app/backend

# install dependencies
COPY ./backend/package.json ./backend/package-lock.json ./
RUN npm ci

# build
COPY ./backend .
RUN npm run build

# cleanup
RUN npm prune --omit=dev



## RUNNER ##
FROM node:20-alpine

ARG VERSION

WORKDIR /app

# copy backend files
COPY --from=build-backend /app/backend/node_modules /app/backend/node_modules
COPY --from=build-backend /app/backend/dist /app/backend/dist
COPY --from=build-backend /app/backend/assets /app/backend/assets
COPY --from=build-backend /app/backend/package.json /app/backend/

# copy frontend files
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# run
WORKDIR /app/backend

ENV NODE_ENV=production
ENV VERSION=$VERSION
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD [ "npm","start" ]
