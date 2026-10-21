# --- Stage 1: build the Worker with Wrangler -----------------------
FROM node:26-alpine AS builder

WORKDIR /app

# Install dependencies & wrangler
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build:docker

# --- Stage 2: minimal runtime with workerd -------------------------
FROM debian:bookworm-slim AS runtime

# Install TLS certificates and shared libraries required by the workerd binary
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates libstdc++6 libatomic1 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules/workerd/bin/workerd /usr/local/bin/workerd

WORKDIR /worker

# Bring in the compiled Worker bundle and config
COPY --from=builder /app/dist/docker ./
COPY --from=builder /app/LICENSE ./LICENSE

# Expose the port workerd listens on
EXPOSE 8080

USER 10001:10001
CMD ["workerd", "serve", "config.capnp", "--directory-path", "static=/worker/public"]
