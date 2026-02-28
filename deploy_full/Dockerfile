FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

# Copy application source and build static assets.
COPY index.html ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY components.json ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src
RUN yarn build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
RUN apk add --no-cache openssl \
  && mkdir -p /etc/nginx/certs \
  && chown -R 101:101 /etc/nginx/certs

COPY deploy2/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy2/entrypoint.sh /entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /entrypoint.sh

USER 101

EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-check-certificate -q -O /dev/null https://127.0.0.1:8443/healthz || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
