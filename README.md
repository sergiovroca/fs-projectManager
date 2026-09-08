# Task Manager Full Stack

Aplicación de gestión de tareas con autenticación de usuarios: permite registrarse,
iniciar sesión y, ya autenticado, crear, listar, editar y eliminar tareas con
prioridad y estado de completado. Está construida con React + Vite en el frontend y
una API REST en Express con Prisma y PostgreSQL.

[![CI](https://github.com/sergiovroca/fs-projectManager/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/sergiovroca/fs-projectManager/actions/workflows/ci.yml)

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
- El proyecto aún no incluye seeds: tras aplicar las migraciones la base queda vacía
  y los primeros datos se crean registrando un usuario desde la aplicación.

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
