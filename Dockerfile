FROM node:23-alpine

WORKDIR /usr/src/app

# 1. Copy manifest, cài cả dev-deps để build & generate Prisma
COPY package*.json ./
RUN npm ci

# 2. Copy Prisma schema & sinh client
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copy source code & build
COPY . .
RUN npm run build

# 4. Chạy app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
