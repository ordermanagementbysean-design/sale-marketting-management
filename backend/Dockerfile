FROM php:8.4-cli-alpine

# Install system deps (bash for docker exec -it backend-app bash)
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    mysql-client

# PHP extensions for Laravel
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    zip \
    exif \
    pcntl \
    bcmath \
    gd \
    intl \
    opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy app files
COPY . .

# Install PHP dependencies (skip scripts to avoid key generate in build)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
    && composer dump-autoload --optimize

# Create storage/cache dirs and set permissions
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Install deps if vendor missing (e.g. when source is mounted), ensure .env, then key, migrate, serve
CMD ["sh", "-c", "if [ ! -f vendor/autoload.php ]; then composer install --no-interaction; fi && [ -f .env ] || cp .env.example .env && php artisan key:generate --no-interaction --force 2>/dev/null || true && php artisan migrate --force --no-interaction 2>/dev/null || true && php artisan serve --host=0.0.0.0 --port=8000"]
