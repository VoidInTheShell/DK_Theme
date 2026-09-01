FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BASE_PATH=/dk-theme/
ARG VITE_APP_NAME=XBoard Staging
ARG VITE_API_BASE_URL=/
ARG VITE_ENABLE_MOCK=false

ENV VITE_BASE_PATH=${VITE_BASE_PATH} \
    VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_ENABLE_MOCK=${VITE_ENABLE_MOCK}

RUN npm run build

FROM nginx:1.28-alpine

COPY deploy/staging/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html/dk-theme
COPY --from=builder /app/dist/index.html /usr/share/nginx/html/index.html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
