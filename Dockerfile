# ===================================================================
# Stage 1 : Build avec Bun
# ===================================================================
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Installer les dépendances (layer mis en cache séparément)
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copier les sources et builder
COPY . .
RUN bun run build

# ===================================================================
# Stage 2 : Serveur Nginx (image finale légère ~25 MB)
# ===================================================================
FROM nginx:1.27-alpine AS runner

# Supprimer la config par défaut et copier la nôtre
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build statique
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
