# ---- Runtime stage (pre-built assets) ----
# Assets are built locally before docker build via: npm run build
FROM nginx:1.25-alpine

# Copy pre-built static files (Vite outputs to 'build/')
COPY build /usr/share/nginx/html

# Copy nginx config (handles SPA routing and caching)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
