#!/bin/sh
set -e

# Only the main app container bootstraps the project; queue/vite reuse it.
if [ "${BOOTSTRAP:-false}" = "true" ]; then
    [ -f .env ] || cp .env.example .env
    [ -f vendor/autoload.php ] || composer install --no-interaction
    grep -q '^APP_KEY=base64:' .env || php artisan key:generate --ansi
    [ -f node_modules/.package-lock.json ] || npm ci
    php artisan migrate --force --ansi
fi

exec "$@"
