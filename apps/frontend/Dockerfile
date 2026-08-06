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

FROM nginx:alpine
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
