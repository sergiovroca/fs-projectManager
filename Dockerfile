# Dockerfile del FRONTEND (React + Vite). Vive en la raíz porque el frontend está en la raíz del repo.

# Etapa 1: construir la aplicación con Node
FROM node:22-alpine AS build

# El proyecto usa pnpm (la imagen de Node solo trae npm)
RUN npm install -g pnpm@11.9.0

WORKDIR /app

# Primero solo las dependencias (para aprovechar la caché de capas)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Después el código, y se compila: el resultado queda en /app/dist
COPY . .
RUN pnpm run build

# Etapa 2: servir los archivos estáticos con nginx (sin Node ni node_modules)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
