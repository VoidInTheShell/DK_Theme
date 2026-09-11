#!/bin/sh
set -eu

CONFIG_DIR="/var/run/xboard-admin-route"
CONFIG_FILE="${CONFIG_DIR}/active.conf"
PATH_FILE="${CONFIG_DIR}/active-path"
TEMPLATE="/usr/local/share/xboard-admin-route.conf.template"
TOKEN_FILE="${ADMIN_ROUTE_TOKEN_FILE:-/run/secrets/admin_route_token}"
ENTRY_ENDPOINT="${XBOARD_ADMIN_ROUTE_ENDPOINT:-http://xboard-app:7001/_internal/standalone-admin/entry}"

# Keep image validation usable without a Compose secret or a live Xboard.
if [ "${1:-}" = "nginx" ] && [ "${2:-}" = "-t" ]; then
    exec "$@"
fi

fail() {
    printf '%s\n' "xboard-admin-route-sync: $*" >&2
    exit 1
}

read_token() {
    [ -r "$TOKEN_FILE" ] || fail "administrator route token is not readable"
    token=$(tr -d '\r\n' < "$TOKEN_FILE")
    [ -n "$token" ] || fail "administrator route token is empty"
    [ "${#token}" -ge 16 ] || fail "administrator route token is too short"
    case "$token" in
        *[!A-Za-z0-9_-]*) fail "administrator route token contains unsupported characters" ;;
    esac
    printf '%s' "$token"
}

valid_path() {
    value="$1"
    [ "$value" != "passport" ] && printf '%s' "$value" | grep -Eq '^[A-Za-z0-9_-]{8,}$'
}

sync_route() {
    route_path=$(wget -q -O - --header "X-Xboard-Admin-Route-Token: $ROUTE_TOKEN" "$ENTRY_ENDPOINT" 2>/dev/null || true)
    route_path=$(printf '%s' "$route_path" | tr -d '\r\n')
    valid_path "$route_path" || return 1

    if [ -f "$PATH_FILE" ] && [ "$(cat "$PATH_FILE")" = "$route_path" ]; then
        return 2
    fi

    next_file="${CONFIG_DIR}/active.next"
    sed \
        -e "s/__ADMIN_PATH__/${route_path}/g" \
        -e "s/__ADMIN_ROUTE_TOKEN__/${ROUTE_TOKEN}/g" \
        "$TEMPLATE" > "$next_file"
    chmod 600 "$next_file"
    mv "$next_file" "$CONFIG_FILE"
    printf '%s\n' "$route_path" > "$PATH_FILE"
    chmod 600 "$PATH_FILE"
    return 0
}

umask 077
[ -f "$TEMPLATE" ] || fail "route template is missing"
ROUTE_TOKEN=$(read_token)
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

ready=0
for _ in $(seq 1 60); do
    if sync_route; then
        ready=1
        break
    fi
    sleep 1
done
[ "$ready" = "1" ] || fail "could not load the active administrator route"

nginx -t

refresh_forever() {
    while :; do
        if sync_route; then
            nginx -s reload >/dev/null 2>&1 || true
        fi
        sleep 2
    done
}

refresh_forever &
exec "$@"
