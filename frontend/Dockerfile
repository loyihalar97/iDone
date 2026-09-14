# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm install --workspace=@app/shared-types --workspace=@app/frontend --include-workspace-root

COPY packages/shared-types packages/shared-types
COPY apps/frontend apps/frontend

WORKDIR /repo/apps/frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf.template /etc/nginx/nginx.conf.template

ENV PORT=80
EXPOSE 80

CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
