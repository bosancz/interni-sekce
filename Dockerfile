# syntax=docker/dockerfile:1.7


## FRONTEND BUILD ##
FROM node:24-alpine AS build-frontend

ARG NG_CONFIGURATION=production

WORKDIR /app/frontend

# install dependencies
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# build
COPY ./frontend .
ARG VERSION
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



## WORKER ##
FROM python:3.12-slim AS worker

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 MODELS_DIR=/app/models DATA_DIR=/data

WORKDIR /app

COPY ./worker/requirements.txt .
RUN pip install -r requirements.txt

ARG OPENCV_ZOO=https://media.githubusercontent.com/media/opencv/opencv_zoo/47534e27c9851bb1128ccc0102f1145e27f23f98/models
ADD --checksum=sha256:8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4 \
	${OPENCV_ZOO}/face_detection_yunet/face_detection_yunet_2023mar.onnx models/
ADD --checksum=sha256:0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79 \
	${OPENCV_ZOO}/face_recognition_sface/face_recognition_sface_2021dec.onnx models/
ADD --checksum=sha256:4f61307602fc089ce20488a31d4e4614e3c9753a7d6c41578c854858b183e1a9 \
	${OPENCV_ZOO}/facial_expression_recognition/facial_expression_recognition_mobilefacenet_2022july.onnx models/

ARG CLIP_VISION=https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/d15189d7028b43f1d3e65039190477f6af591c2a
ARG CLIP_TEXT=https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1/resolve/58edf8cada9e398793dca955574a48cbb7f18be2
ADD --checksum=sha256:35c4e0fb0aeee527dcde1693520b214a34424a786babd530f35366bad5844efd \
	${CLIP_VISION}/onnx/vision_model_fp16.onnx models/clip-vit-base-patch32-vision.onnx
ADD --checksum=sha256:fbc8fbeaa5237d96bd1bf430057c70d34de8334a463e933a5faa305f6caeed9c \
	${CLIP_TEXT}/onnx/model_quint8_avx2.onnx models/clip-vit-base-patch32-multilingual-text.onnx
ADD --checksum=sha256:5b4e1a8171c81dfd666ae40265b9530c6e0b3d53923fe8ac493dcc84229adf81 \
	${CLIP_TEXT}/tokenizer.json models/clip-vit-base-patch32-multilingual-tokenizer.json
ADD --checksum=sha256:d12568dc7300970a4d3dbb49068ad16cd89b99840b74b026f8e48071e9414f74 \
	${CLIP_TEXT}/2_Dense/model.safetensors models/clip-vit-base-patch32-multilingual-dense.safetensors

COPY ./worker/worker ./worker

RUN useradd --system --uid 1001 --no-create-home worker && chmod -R a+r /app/models
USER worker

CMD ["python", "-m", "worker"]



## DATABASE ##
FROM postgres:15-bookworm AS postgres

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-${PG_MAJOR}-postgis-3 \
		postgresql-${PG_MAJOR}-postgis-3-scripts \
		postgresql-${PG_MAJOR}-pgvector \
	&& rm -rf /var/lib/apt/lists/*



## RUNNER ##
FROM node:24-alpine AS app

# Chromium used by Puppeteer to render registration PDFs from HTML templates.
# font-noto-emoji: without it Chromium has no emoji glyphs and renders tofu boxes in the PDF.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto-emoji
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

# issues released so far, written next to the changelog by scripts/generate-changelog.mjs and read at
# startup to notify their reporters; the glob keeps the build working when the generator has not run
COPY release-issues.jso[n] /app/

# run
WORKDIR /app/backend

ARG VERSION
ENV NODE_ENV=production
ENV VERSION=$VERSION
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
