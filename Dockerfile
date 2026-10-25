# ==============================================================================
# Multi-stage Dockerfile dla SolidHome App (Angular 21 + Nginx)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build - kompilacja aplikacji Angular
# ------------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Włączenie menedżera pakietów pnpm za pomocą Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Kopiowanie plików definicji pakietów z optymalizacją pod cache Dockera
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Instalacja zależności
RUN pnpm install --frozen-lockfile

# Kopiowanie kodu źródłowego i konfiguracji
COPY . ./

# Budowanie aplikacji Angular w trybie produkcyjnym
RUN pnpm run build

# ------------------------------------------------------------------------------
# Stage 2: Runner - serwer Nginx do serwowania aplikacji SPA
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Konfiguracja Nginx pod Single Page Application (SPA), kompresję gzip i PWA
RUN cat << 'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Kompresja gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Obsługa routingu SPA (przekierowanie tras do index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Długoterminowe cachowanie zasobów statycznych (hashe w nazwach plików)
    location ~* \.(?:ico|css|js|gif|jpe?g|png|svg|woff2?|eot|ttf|otf)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
        try_files $uri =404;
    }

    # Brak cachowania dla pliku wejściowego i Service Workera (PWA)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = /ngsw.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = /ngsw-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Skopiowanie zbudowanych plików produkcyjnych z etapu builder
COPY --from=builder /app/dist/SolidHomeApp/browser /usr/share/nginx/html

# Port nasłuchiwania Nginx
EXPOSE 80

# Health check sprawdzający dostępność serwera Nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

# Uruchomienie serwera Nginx na pierwszym planie
CMD ["nginx", "-g", "daemon off;"]
