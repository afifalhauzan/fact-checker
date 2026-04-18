# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
# This creates the .next/standalone folder
RUN pnpm run build

# --- STAGE 2: RUNNER ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy the core server files
COPY --from=builder /app/web/.next/standalone ./

# 2. Copy the static assets (Notice the path: web/.next/static)
# This ensures Tailwind and Next.js chunks actually load
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public

EXPOSE 3000

# 3. Run the server from the subfolder path
CMD ["node", "web/server.js"]