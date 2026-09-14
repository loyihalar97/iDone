FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY apps/bot/package.json apps/bot/package.json

RUN npm install --workspace=@app/bot --include-workspace-root

COPY apps/bot apps/bot

WORKDIR /repo/apps/bot
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/bot/dist ./dist
COPY --from=build /repo/apps/bot/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 4100
CMD ["node", "dist/server.js"]
