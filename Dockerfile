# ============================================================================
# Yagona (single-service) image: backend API + Telegram bot + frontend statik.
# Railway'da bitta servis sifatida ishlaydi (Postgres alohida plugin).
# Bu 3 ta alohida Node/nginx servis o'rniga 1 tasi bilan cheklanib, oylik
# Railway xarajatini sezilarli kamaytiradi.
# ============================================================================

# ---- Build stage ----
FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# package manifestlar (kesh qatlamlari uchun avval nusxalanadi)
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm install \
  --workspace=@app/shared-types \
  --workspace=@app/backend \
  --workspace=@app/frontend \
  --include-workspace-root

# manba kod
COPY packages/shared-types packages/shared-types
COPY apps/backend apps/backend
COPY apps/frontend apps/frontend

# shared-types
RUN npm run build --workspace=@app/shared-types

# frontend build — API bir xil originda, shuning uchun nisbiy "/api"
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace=@app/frontend

# backend build (+ prisma generate)
WORKDIR /repo/apps/backend
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/prisma ./prisma
COPY --from=build /repo/apps/backend/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /repo/packages/shared-types/package.json ./packages/shared-types/package.json
# frontend statik build -> Express `public` papkasidan beriladi
COPY --from=build /repo/apps/frontend/dist ./public

RUN mkdir -p uploads

EXPOSE 4000
# 1) premigrate: eski enum ustunini xavfsiz text ga o'tkazadi (kerak bo'lsa)
# 2) prisma db push: migratsiya fayllarisiz sxemani bazaga qo'llaydi
#    (fresh yoki mavjud DB uchun). 3) serverni ishga tushiradi.
CMD ["sh", "-c", "node dist/premigrate.js && npx prisma db push --skip-generate --accept-data-loss && node dist/server.js"]
