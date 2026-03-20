# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_ env vars must be passed as build args because Vite bakes them into
# the JavaScript bundle at build time (not available at container runtime).
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_PAYHERE_MERCHANT_ID
ARG VITE_PAYHERE_SANDBOX=false

RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.25-alpine AS runtime

# Copy built static files (Vite outputs to 'build/' per vite.config.ts outDir setting)
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config (handles SPA routing and caching)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
