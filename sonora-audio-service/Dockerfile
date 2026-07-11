FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY proto ./proto
COPY src ./src
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./package.json
COPY proto ./proto
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
RUN mkdir -p /tmp/sonora-audio
EXPOSE 50051
CMD ["node", "dist/server.js"]
