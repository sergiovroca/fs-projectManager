# Task Manager Full Stack

Aplicación de gestión de tareas con autenticación de usuarios: permite registrarse,
iniciar sesión y, ya autenticado, crear, listar, editar y eliminar tareas con
prioridad y estado de completado. Está construida con React + Vite en el frontend y
una API REST en Express con Prisma y PostgreSQL.

[![CI](https://github.com/sergiovroca/fs-projectManager/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/sergiovroca/fs-projectManager/actions/workflows/ci.yml)

## 🐳 Levantar con Docker (recomendado)

Solo necesitas **Docker Desktop** (o Docker Engine + Compose) funcionando. No hace falta
instalar Node, pnpm ni PostgreSQL.

```bash
git clone https://github.com/sergiovroca/fs-projectManager.git
cd fs-projectManager

cp .env.example .env          # en PowerShell: Copy-Item .env.example .env
docker compose up --build
```

La primera vez, con los contenedores ya corriendo, aplica las migraciones en otra terminal:

```bash
docker compose exec backend pnpm exec prisma migrate deploy
```

Abre **http://localhost:5173**, crea una cuenta con **Registrarse**, inicia sesión y ya
puedes crear tareas.

| Servicio   | URL / puerto en tu máquina | Dentro de Docker   |
|------------|----------------------------|--------------------|
| Frontend   | http://localhost:5173      | nginx, puerto 80   |
| Backend    | http://localhost:3000      | Express, puerto 4000 |
| PostgreSQL | localhost:5436             | `postgres:5432`    |

- `docker compose down` detiene todo y **conserva** los datos (volumen `postgres_data`).
- `docker compose down -v` detiene todo y **borra** la base de datos.
- Si un puerto está ocupado (`port is already allocated`), cambia el número de la
  izquierda en `docker-compose.yml`, por ejemplo `"5437:5432"`.

## 🚂 Despliegue (Railway)

El backend se despliega en [Railway](https://railway.com) desde el pipeline de CI, con
dos ambientes separados, cada uno con su propia base de datos y variables:

| Ambiente     | Cuándo se despliega                                                  |
|--------------|----------------------------------------------------------------------|
| `staging`    | Automático tras cada merge a `main`, solo si todos los checks pasan   |
| `production` | Manual: Actions → CI → **Run workflow** escribiendo `DEPLOY`          |

- El pipeline usa el Secret `RAILWAY_TOKEN` (token de cuenta de Railway).
- El servicio `backend` usa **Root Directory** `/backend`, porque el Dockerfile de la
  raíz es el del frontend.
- Variables del servicio: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET`
  (distinto en cada ambiente) y `PORT=4000`.
- Healthcheck: `GET /health` responde `{"status":"ok","version":"1.1.0","uptime":<segundos>}`.
  Los campos `version` y `uptime` permiten confirmar, desde el navegador, que el
  ambiente está sirviendo el último despliegue y no una versión anterior.

## 🚀 Instalación local

Requisitos: Node.js 18 o superior, pnpm, y una base de datos PostgreSQL en ejecución.

Todos los comandos se ejecutan desde la raíz del proyecto.

```bash
git clone https://github.com/sergiovroca/fs-projectManager.git
cd fs-projectManager

pnpm install                  # dependencias del frontend
pnpm --dir backend install    # dependencias del backend
```

### Variables de entorno

El backend necesita un archivo `backend/.env`. Parte de la plantilla incluida:

```bash
cp backend/.env.example backend/.env
```

Y completa las dos claves:

```
DATABASE_URL=
JWT_SECRET=
```

- `DATABASE_URL` — conexión a PostgreSQL, con el formato
  `postgresql://USUARIO:CONTRASENA@HOST:PUERTO/BASE?schema=public`
- `JWT_SECRET` — cadena larga y aleatoria para firmar los tokens de sesión

El archivo `.env` no se versiona. En el pipeline de CI/CD estos valores viajan como
GitHub Secrets, nunca dentro del repositorio.

### Preparar la base de datos

```bash
pnpm --dir backend prisma migrate dev
```

### Levantar la aplicación

Necesitas los dos procesos a la vez, en terminales separadas:

```bash
pnpm dev                # frontend → http://localhost:5173
pnpm --dir backend dev  # API      → http://localhost:3000
```

> El frontend consulta la API en `http://localhost:3000` (valor fijo en el código),
> así que el backend debe correr en ese puerto para que la aplicación funcione.

## 📜 Comandos disponibles

Frontend (React + Vite), desde la raíz:

| Comando        | Descripción                                        |
|----------------|----------------------------------------------------|
| `pnpm dev`     | Levanta el entorno de desarrollo en el puerto 5173 |
| `pnpm build`   | Genera el build de producción en `dist/`           |
| `pnpm preview` | Sirve localmente el build ya generado              |
| `pnpm lint`    | Analiza el código con ESLint                       |
| `pnpm test`    | Pruebas automatizadas (pendiente — Sesión 3)       |

Backend (Express + Prisma), desde la raíz con `--dir backend`:

| Comando                            | Descripción                                    |
|------------------------------------|------------------------------------------------|
| `pnpm --dir backend dev`           | Levanta la API en el puerto 3000               |
| `pnpm --dir backend prisma migrate dev` | Aplica las migraciones y genera el cliente |
| `pnpm --dir backend prisma studio` | Abre un explorador visual de la base de datos  |

## 🗄️ Base de datos

PostgreSQL, con el esquema y las migraciones gestionados por **Prisma 7**
(carpeta `backend/prisma/`).

- `schema.prisma` define los modelos `Task` y `User`.
- `migrations/` guarda el historial versionado del esquema:
  - `init` — tabla `Task`
  - `add_user_model` — tabla `User`, para el registro y el login
- `seed.ts` carga una tarea de ejemplo. Es reproducible (usa `upsert`): correrlo
  varias veces no duplica datos. Con Docker:
  `docker compose exec backend pnpm exec prisma db seed`
- Las rutas `/tasks` exigen sesión, así que para verlas en la app igual hay que
  registrar un usuario.

### En el pipeline de CI

- **Migraciones y Seeds**: levanta un PostgreSQL efímero (solo existe durante la
  ejecución), aplica `prisma migrate deploy` y corre el seed dos veces comprobando
  que no se duplica nada. Sus credenciales son fijas y de prueba a propósito.
- **Backend - Pruebas con variables seguras**: recibe `DATABASE_URL` y `JWT_SECRET`
  desde **GitHub Secrets** (Settings → Secrets and variables → Actions). Si falta
  alguno, el job falla con un aviso, sin mostrar nunca su valor.

## 🗂️ Estructura del proyecto

```
fs-projectManager/
├── src/              # Frontend React (componentes, estilos)
├── public/           # Archivos estáticos
├── backend/
│   ├── src/          # API Express: rutas de tareas y autenticación
│   ├── prisma/       # schema.prisma y migraciones
│   └── .env.example  # Plantilla de variables de entorno
├── index.html
└── vite.config.js
```

## 🔐 Autenticación

El registro y el login emiten un token JWT que el frontend guarda y envía en la
cabecera `Authorization: Bearer <token>` de cada petición. Las contraseñas se
almacenan hasheadas con bcrypt, nunca en texto plano.

Todas las rutas de tareas (`/tasks`) pasan por un middleware que valida el token:
sin un token válido la API responde 401. La lista de tareas es común a todos los
usuarios autenticados; el modelo `Task` todavía no tiene relación con `User`, de
modo que las tareas no están segmentadas por dueño.
