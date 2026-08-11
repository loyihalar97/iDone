# ---- Build stage ----
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /repo

COPY package.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm install --workspace=@app/shared-types --workspace=@app/backend --include-workspace-root

COPY packages/shared-types packages/shared-types
COPY apps/backend apps/backend

WORKDIR /repo/apps/backend
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/prisma ./prisma
COPY --from=build /repo/apps/backend/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

RUN mkdir -p uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
