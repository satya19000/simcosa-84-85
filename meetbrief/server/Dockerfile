# Build from the meetbrief/ directory:  docker build -f server/Dockerfile -t meetbrief-server .
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --workspace shared --workspace server --include-workspace-root=false
COPY shared shared
COPY server server
RUN npm run build -w shared && npm run build -w server && npm prune --omit=dev --workspace shared --workspace server

FROM node:22-bookworm-slim
# ffmpeg decodes recordings/uploads, extracts audio from video, and cuts windows.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/shared/package.json shared/package.json
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/server/dist server/dist
USER node
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
