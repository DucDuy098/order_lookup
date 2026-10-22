FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.html dev-server.js ./
COPY api ./api
EXPOSE 3000
CMD ["node", "dev-server.js"]
