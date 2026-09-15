FROM node:22-alpine

# Prisma necesita OpenSSL y la imagen alpine no lo trae.
# tini hace que Ctrl+C detenga el contenedor (Node como proceso principal lo ignora).
RUN apk add --no-cache openssl tini

# Tu proyecto usa pnpm, no npm
RUN npm install -g pnpm@11.9.0

WORKDIR /app

# 1) Primero solo los archivos de dependencias (para aprovechar la caché)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 2) Después, el resto del código
COPY . .

# 3) Generar el cliente de Prisma dentro de la imagen
RUN pnpm exec prisma generate

# Dentro del contenedor el backend escucha en el 4000 (src/index.ts lee PORT)
ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "exec", "ts-node-dev", "--transpile-only", "src/index.ts"]
