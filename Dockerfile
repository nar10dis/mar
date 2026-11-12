# ---- build: compile the React front and the Nest API ----
FROM node:22-alpine AS build
WORKDIR /app
# Only used by `prisma generate` at build time; the real URL is injected at runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

COPY web/package*.json web/
RUN npm ci --prefix web

COPY api/package*.json api/prisma.config.ts api/
COPY api/prisma api/prisma
RUN npm ci --prefix api

COPY web web
COPY api api
RUN npm run build --prefix web && npm run build --prefix api

# ---- runtime: one service = API + websocket + static front ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/api api
COPY --from=build /app/web/dist web/dist
WORKDIR /app/api
EXPOSE 3000
# Applies pending migrations, seeds an empty DB, then starts Nest.
CMD ["npm", "run", "start:prod"]
