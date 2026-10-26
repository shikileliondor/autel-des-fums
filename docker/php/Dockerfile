# syntax=docker/dockerfile:1

ARG PHP_VERSION=8.4
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS node

# ---------------------------------------------------------------------------
# Base: PHP-FPM with the extensions Laravel needs
# ---------------------------------------------------------------------------
FROM php:${PHP_VERSION}-fpm-alpine AS base

COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

RUN install-php-extensions \
        bcmath \
        intl \
        opcache \
        pcntl \
        pdo_mysql \
        redis \
        zip \
    && apk add --no-cache git unzip

WORKDIR /var/www/html

# ---------------------------------------------------------------------------
# Dev: adds Node (Vite + the Wayfinder plugin, which calls `php artisan`)
# ---------------------------------------------------------------------------
FROM base AS dev

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY docker/php/conf.d/app.ini "$PHP_INI_DIR/conf.d/zz-app.ini"

COPY docker/php/entrypoint.dev.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]

# ---------------------------------------------------------------------------
# Assets: build front-end bundle (needs PHP for Wayfinder route generation)
# ---------------------------------------------------------------------------
FROM dev AS assets

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN composer dump-autoload --no-dev --optimize \
    && cp .env.example .env \
    && php artisan key:generate \
    && npm run build \
    && rm .env

# ---------------------------------------------------------------------------
# Production: PHP-FPM image with vendor + built assets, no Node
# ---------------------------------------------------------------------------
FROM base AS production

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php/conf.d/app.ini "$PHP_INI_DIR/conf.d/zz-app.ini"
COPY docker/php/conf.d/opcache.prod.ini "$PHP_INI_DIR/conf.d/zz-opcache.ini"

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
COPY --from=assets /var/www/html/public/build ./public/build

RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && php artisan package:discover --ansi \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

CMD ["php-fpm"]

# ---------------------------------------------------------------------------
# Web: nginx serving public/ and proxying PHP to the production app container
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS web

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=production /var/www/html/public /var/www/html/public
