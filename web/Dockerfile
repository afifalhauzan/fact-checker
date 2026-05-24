# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY web/package.json web/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
# This creates the .next/standalone folder
RUN pnpm run build

# --- STAGE 2: RUNNER ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy the core server files
COPY --from=builder /app/.next/standalone ./

# 2. Copy the static assets
# This ensures Tailwind and Next.js chunks actually load
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# 3. Run the standalone Next.js server
CMD ["node", "server.js"]
