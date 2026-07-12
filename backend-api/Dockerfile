# Delta Food Supplies API — Cloud Run container
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src ./src

# Run as non-root
USER node

EXPOSE 8080
CMD ["node", "src/server.js"]
