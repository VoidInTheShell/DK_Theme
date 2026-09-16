FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BASE_PATH=/dk-theme/
ARG VITE_APP_NAME=UEG-Net
ARG VITE_API_BASE_URL=/
ARG VITE_ENABLE_MOCK=false

ENV VITE_BASE_PATH=${VITE_BASE_PATH} \
    VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_ENABLE_MOCK=${VITE_ENABLE_MOCK}

RUN npm run build

FROM nginx:1.28-alpine

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.version=${APP_VERSION}
RUN printf '%s\n' "$APP_VERSION" > /etc/xboard-version

COPY deploy/staging/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/staging/admin-route.conf.template /usr/local/share/xboard-admin-route.conf.template
COPY --chmod=755 deploy/staging/admin-route-sync.sh /usr/local/bin/xboard-admin-route-sync
COPY --from=builder /app/dist /usr/share/nginx/html/dk-theme
COPY --from=builder /app/dist/index.html /usr/share/nginx/html/index.html

ENTRYPOINT ["/usr/local/bin/xboard-admin-route-sync"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=10s \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
