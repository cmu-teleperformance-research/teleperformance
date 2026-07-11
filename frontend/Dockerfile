# syntax=docker/dockerfile:1

# ======================================================================
# Stage 1 — build the static assets with Node
# ======================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy only the manifest + lockfile first so this layer is cached and
# `npm ci` is skipped on rebuilds unless dependencies actually changed.
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the rest of the source and build.
COPY . .

# Vite inlines VITE_* variables into the JS bundle at BUILD time, not
# runtime — unlike the backend, this can't be changed by setting an
# env var on the Cloud Run service after deploy. Accept it as a build
# arg so CI/CD can point the frontend at the tp-backend Cloud Run URL.
# Falls back to the production Cloud Run backend if not provided, matching
# frontend/src/config.js's existing default.
ARG VITE_API_URL=https://tp-backend-408239274811.us-central1.run.app
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ======================================================================
# Stage 2 — serve the built assets with Nginx
# ======================================================================
FROM nginx:1.27-alpine AS final

# Remove the image's default static content so only our build output
# is served (avoids leaking the stock Nginx welcome page / 50x.html).
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

# A *.template file here gets envsubst'd by the base image's
# docker-entrypoint.d startup script into /etc/nginx/conf.d/default.conf
# before Nginx starts — this is how $PORT gets substituted at container
# start (Cloud Run only decides the port at runtime, not build time).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default only, for `docker run` outside Cloud Run — Cloud Run injects
# its own PORT value (currently 8080) at container start.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
