#!/usr/bin/env bash
set -Eeuo pipefail

TARGET_DIR="/home/beihai/docker/xboard"
EXPECTED_TARGET="/home/beihai/docker/xboard"
THEME_REPOSITORY="https://github.com/VoidInTheShell/DK_Theme.git"
GIT_SHA="${1:-}"
THEME_IMAGE="${2:-}"
REGISTRY_USER="${3:-}"

log() {
    printf '[production-theme] %s\n' "$*"
}

fail() {
    printf '[production-theme] ERROR: %s\n' "$*" >&2
    exit 1
}

set_env_value() {
    local file="$1"
    local key="$2"
    local value="$3"
    local temp_file
    temp_file=$(mktemp "${file}.XXXXXX")
    awk -v key="$key" -v value="$value" '
        BEGIN { found = 0 }
        index($0, key "=") == 1 { print key "=" value; found = 1; next }
        { print }
        END { if (!found) print key "=" value }
    ' "$file" > "$temp_file"
    install -o root -g root -m 600 "$temp_file" "$file"
    rm -f "$temp_file"
}

[ "$(id -u)" = "0" ] || fail "this trusted deployment script must run as root"
[[ "$GIT_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "the release SHA is invalid"
[[ "$THEME_IMAGE" =~ ^ghcr\.io/voidintheshell/dk_theme@sha256:[0-9a-f]{64}$ ]] || fail "theme image must be an immutable DK Theme digest"
[[ "$REGISTRY_USER" =~ ^[A-Za-z0-9-]{1,39}$ ]] || fail "the registry user is invalid"
[ "$(realpath -m "$TARGET_DIR")" = "$EXPECTED_TARGET" ] || fail "unexpected target directory"
[ -f "$TARGET_DIR/compose.yaml" ] || fail "the production panel Compose file is not installed"
[ -f "$TARGET_DIR/.deploy.env" ] || fail "the production panel environment is not installed"

CURRENT_SHA=$(git ls-remote --exit-code --refs "$THEME_REPOSITORY" refs/heads/main | awk 'NR == 1 { print $1 }')
[ "$GIT_SHA" = "$CURRENT_SHA" ] || fail "release SHA is not the current DK Theme main"

IFS= read -r REGISTRY_TOKEN || true
[ -n "${REGISTRY_TOKEN:-}" ] || fail "registry token was not provided on stdin"

exec 9>"$TARGET_DIR/.deploy.lock"
flock -x 9
log "acquired production deployment lock"

AUTH_DIR=$(mktemp -d "/tmp/dk-theme-production-auth.XXXXXX")
cleanup() {
    rm -rf -- "$AUTH_DIR"
    unset REGISTRY_TOKEN
}
trap cleanup EXIT

printf '%s\n' "$REGISTRY_TOKEN" | docker --config "$AUTH_DIR" login ghcr.io --username "$REGISTRY_USER" --password-stdin >/dev/null
unset REGISTRY_TOKEN
docker --config "$AUTH_DIR" pull "$THEME_IMAGE"
IMAGE_SHA=$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$THEME_IMAGE" 2>/dev/null || true)
[ "$IMAGE_SHA" = "$GIT_SHA" ] || fail "theme image revision does not match main"

set_env_value "$TARGET_DIR/.deploy.env" "DK_THEME_IMAGE" "$THEME_IMAGE"
compose() {
    docker compose --env-file "$TARGET_DIR/.deploy.env" -f "$TARGET_DIR/compose.yaml" "$@"
}

compose up -d --no-deps theme
for _ in $(seq 1 45); do
    status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' xboard-theme 2>/dev/null || true)
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
        docker exec xboard-theme wget -q -O /dev/null http://127.0.0.1/healthz
        log "production theme deployment complete"
        compose ps theme
        exit 0
    fi
    if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "dead" ]; then
        break
    fi
    sleep 2
done

compose ps theme || true
compose logs --tail 120 theme || true
fail "theme container did not become healthy"
