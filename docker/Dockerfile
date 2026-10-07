FROM node:18-alpine AS base

ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

WORKDIR /app

SHELL ["/bin/sh", "-xo", "pipefail", "-c"]

## Install system dependencies
RUN apk -U upgrade && \
    apk add --no-cache curl

## Delete app directory if base is targeted
ENTRYPOINT ["rm", "-rf", "/app"]

## Copy project files to workdir
COPY . .

FROM base as deploy

WORKDIR /app

COPY docker/docker-node-entrypoint.sh /usr/local/bin/docker-node-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-node-entrypoint.sh
ENTRYPOINT ["docker-node-entrypoint.sh"]

RUN set -ex && \
    yarn install --pure-lockfile --update-checksums --non-interactive && \
    yarn build && \
    yarn install --pure-lockfile --update-checksums --non-interactive --prod && \
    yarn cache clean && \
    # Remove source directories and files
    rm -rf src test .yarnrc .npmrc tsconfig.build.json tsconfig.json .prettierrc .eslintrc.js sonar-project.properties && \
    ls -a
ENV HTTP_PROXY=
ENV HTTPS_PROXY=