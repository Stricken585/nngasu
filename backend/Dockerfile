# Dev-образ: исходники монтируются bind-mount'ом, node_modules живут в образе
# (анонимный volume в docker-compose.yml не даёт хосту их затереть).
FROM node:22-bookworm-slim

# openssl нужен движку Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
# schema нужна postinstall-скрипту (prisma generate)
COPY prisma ./prisma
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]
