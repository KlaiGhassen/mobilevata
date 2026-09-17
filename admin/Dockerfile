FROM node:22-alpine AS base
RUN npm install -g pnpm@11.24.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG API_PROXY_TARGET=http://api:4000
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
ARG MARKETPLACE_ORIGIN=http://web:3000
ENV MARKETPLACE_ORIGIN=${MARKETPLACE_ORIGIN}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production PORT=3001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start"]