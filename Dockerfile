# ─────────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

# Build-time env vars (passed via --build-arg or docker-compose args)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app

# Copy dependency manifests first (leverages Docker layer cache)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Type-check + build production bundle
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Serve
# ─────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config: serve the SPA with fallback to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
