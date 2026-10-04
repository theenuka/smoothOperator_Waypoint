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
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/src/index.js"]
