FROM node:18-alpine as build-frontend

ARG NG_CONFIGURATION=production

WORKDIR /app

# INSTALL DEPENDENCIES
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# BUILD
COPY ./frontend .
RUN npx ng build --configuration="${NG_CONFIGURATION}"


FROM node:18-alpine as build-backend

WORKDIR /app
ENV NODE_ENV=production

# INSTALL DEPENDENCIES
COPY package.json package-lock.json ./
RUN npm ci

# BUILD
COPY . .
RUN npm run build

# CLEANUP
RUN npm prune --production


FROM node:18-alpine

WORKDIR /app

# COPY FILES
COPY --from=build-frontend /app ./frontend
COPY --from=build-backend /app ./backend
COPY package.json ./

# RUN
WORKDIR /app/backend
CMD npm start
