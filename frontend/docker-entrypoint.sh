#!/bin/sh
# Writes runtime config into /usr/share/nginx/html/config.js before nginx starts.
# This allows API_URL to be injected via environment variable at container run time,
# so the same image works for both local dev and production without rebuilding.

cat > /usr/share/nginx/html/config.js << EOF
window.APP_CONFIG = {
  API_URL: "${API_URL:-http://localhost:8000/api/v1}"
};
EOF

exec nginx -g "daemon off;"
