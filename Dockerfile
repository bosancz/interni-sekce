FROM node:20-alpine as build-frontend

ARG NG_CONFIGURATION=production

WORKDIR /app

# INSTALL DEPENDENCIES
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# BUILD
COPY ./frontend .
RUN npx ng build --configuration="${NG_CONFIGURATION}"




FROM node:20-alpine as build-backend

WORKDIR /app

# INSTALL DEPENDENCIES
COPY ./backend/package.json ./backend/package-lock.json ./
RUN npm ci

# BUILD
COPY ./backend .
RUN npm run build

# CLEANUP
RUN npm prune --production




FROM node:20-alpine

WORKDIR /app

# COPY BACKEND
COPY --from=build-backend /app/node_modules ./backend/node_modules
COPY --from=build-backend /app/dist ./backend/dist
COPY --from=build-backend /app/package.json /app/cli.js ./backend/

# COPY FRONTEND
COPY --from=build-frontend /app/dist ./frontend/dist
COPY --from=build-frontend /app/package.json ./frontend/

# COPY MAIN
COPY package.json ./
COPY entrypoint.sh ./

# RUN
ENV NODE_ENV=production
EXPOSE 80
ENTRYPOINT [ "entrypoint.sh" ]
CMD [ "start" ]
