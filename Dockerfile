# One container: the API also serves the built web app. See docs/DEPLOY.md
FROM node:20-slim
WORKDIR /app

# install dependencies first (cached when only code changes)
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --no-audit --no-fund

# build the web app into web/dist
COPY . .
# docker compose passes the local Supabase here. Cloud Run passes nothing, so the build keeps web/.env.production.
# (Not named VITE_*: an empty VITE_* variable would override web/.env.production.)
ARG LOCAL_SUPABASE_URL
ARG LOCAL_SUPABASE_ANON_KEY
RUN if [ -n "$LOCAL_SUPABASE_URL" ]; then \
      printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n' "$LOCAL_SUPABASE_URL" "$LOCAL_SUPABASE_ANON_KEY" > web/.env.production.local; \
    fi && npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/src/index.js"]
