FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG DIST_DIR=dist

USER root
RUN apk add --no-cache openssl \
  && mkdir -p /etc/nginx/certs \
  && chown -R 101:101 /etc/nginx/certs

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/entrypoint.sh /entrypoint.sh
COPY ${DIST_DIR}/ /usr/share/nginx/html/

RUN chmod +x /entrypoint.sh

USER 101

EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-check-certificate -q -O /dev/null https://127.0.0.1:8443/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
