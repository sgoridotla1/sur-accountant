# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# install deps (incl dev deps for tsc)
COPY package*.json ./
RUN npm ci

# copy source + build
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build


# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# bring compiled output and data files
COPY --from=build /app/dist ./dist
COPY data ./data

# change if your app uses a different port
EXPOSE 3000

# IMPORTANT: update entrypoint if yours differs
CMD ["node", "dist/main.js"]
