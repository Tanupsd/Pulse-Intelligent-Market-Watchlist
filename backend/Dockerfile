FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code and migrations
COPY src/ ./src/
COPY server.js ./
COPY ../database/ ./database/

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
