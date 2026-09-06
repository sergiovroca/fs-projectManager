# Esqueleto de la Monografía — Task Manager Full Stack

> **Cómo usar este archivo:** cada sección tiene viñetas con *qué decir*. Tú escribe los
> párrafos con tus propias palabras (la guía exige demostrar que entiendes, no copiar código).
> Al terminar, pásalo a Word/Google Docs con **formato APA** y expórtalo a **PDF**.
> Objetivo: **4 a 6 páginas** de contenido. Nombre del PDF: `Monografia_TaskManager_VargasSergio.pdf`.
>
> APA recuerda: portada aparte, interlineado doble, fuente 12 (Times New Roman/Calibri),
> títulos jerárquicos, márgenes 2.54 cm, referencias solo si citas fuentes externas.

---

## 1. Portada
- Nombre del proyecto: **Task Manager Full Stack**.
- Tu nombre: Sergio Vargas.
- Materia y docente (completa con los datos de tu maestría).
- Fecha de entrega: 10 de julio de 2026.

## 2. Introducción
- Qué es el proyecto: una aplicación web para **gestionar tareas** (crear, listar, marcar como completada, eliminar).
- Qué problema resuelve: organizar tareas de forma **persistente** (no se pierden al recargar) y **segura** (solo usuarios autenticados acceden).
- Menciona que es **full stack**: frontend (React) + backend (Express) + base de datos (PostgreSQL) + autenticación (JWT).

## 3. Objetivo del proyecto
- Construir una app full stack real que guarde tareas en una base de datos y proteja el acceso con login.
- Objetivos específicos: interfaz en React, API con Express, persistencia con Prisma+PostgreSQL, y seguridad con JWT+bcrypt.

## 4. Tecnologías utilizadas
Explica en 1–2 líneas el **rol de cada una en TU proyecto** (no la definición de diccionario):
- **React**: construye la interfaz por componentes (`App`, `TaskInput`, `TaskList`, `TaskCard`, `Auth`, `Footer`).
- **TypeScript**: da tipos a las tareas (`type Task = { id, text, priority, completed }`) y a las props.
- **Node.js**: entorno que ejecuta el backend.
- **Express**: crea las rutas de la API (`/register`, `/login`, `/tasks`, etc.).
- **PostgreSQL**: base de datos real donde viven las tablas `Task` y `User`.
- **Prisma**: ORM que conecta el código con PostgreSQL (consultas como `prisma.task.findMany()`).
- **JWT**: genera un token al iniciar sesión para identificar al usuario.
- **bcrypt (bcryptjs)**: guarda las contraseñas como hash, nunca en texto plano.
- **Thunder Client**: extensión de VS Code para probar las rutas (GET/POST y rutas protegidas).

## 5. Desarrollo del frontend
- Estructura por **componentes** en `src/components/` (Header, TaskInput, TaskList, TaskCard, Footer, Auth).
- **Estado** con `useState`: la lista `tasks`, el `token`, los campos de los formularios.
- **Props**: `App` pasa funciones a los hijos (`onAddTask`, `onDeleteTask`, `onToggleTask`) y datos (`tasks`, contadores).
- **Contadores** del footer: total, completadas y pendientes, recalculados en cada render con `filter`.
- **useEffect**: al montar (y al iniciar sesión) pide las tareas al backend con `fetch`.

## 6. Desarrollo del backend
- Servidor **Express** en `backend/src/index.ts`, escucha en el puerto **3000**.
- Uso de `express.json()` para leer el cuerpo de las peticiones en **JSON**, y `cors()` para permitir que el frontend (puerto 5173) llame al backend (puerto 3000).
- Rutas principales: `/register`, `/login`, `/profile`, y CRUD de `/tasks` (GET, POST, PUT, DELETE).
- Cada ruta responde con `res.json(...)` y códigos de estado (200, 201, 400, 401, 404).

## 7. Base de datos con PostgreSQL y Prisma
- **PostgreSQL** corre en Docker (contenedor `maestria-pg`, puerto 5435), base `taskmanager`.
- Esquema en `backend/prisma/schema.prisma`: modelos **`Task`** (id, text, priority, completed, createdAt) y **`User`** (id, name, email único, password, createdAt).
- **Migraciones**: `init` (tabla Task) y `add_user_model` (tabla User) — crean/actualizan las tablas.
- **Prisma Studio** (`npx prisma studio`) para ver y editar los datos de forma visual. *(Captura #3.)*

## 8. Integración full stack
- Flujo: **React** hace `fetch` → **Express** recibe la petición → **Prisma** consulta/escribe en **PostgreSQL** → Express responde JSON → React actualiza el estado y re-renderiza.
- Ejemplo concreto: al crear una tarea, `addTask` hace `POST /tasks`, el backend usa `prisma.task.create(...)`, y la tarea vuelve al frontend para mostrarse en la lista.

## 9. Autenticación con JWT
- **Login**: el usuario manda email y contraseña; si son correctos, el backend firma un **JWT** con `jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "1h" })`.
- El token viaja al frontend y se guarda en **localStorage**.
- Para entrar a rutas protegidas, el frontend manda el token en el header `Authorization: Bearer <token>`.
- El backend lo verifica con `jwt.verify(token, JWT_SECRET)`.
- *(Trade-off de seguridad que puedes mencionar aquí o en la sección 13):* el token se guarda en **localStorage** por simplicidad; una alternativa **más segura frente a XSS** es una **cookie httpOnly** (que JavaScript no puede leer), a costa de manejar **CSRF** con `SameSite` y configurar CORS con credenciales. Se optó por localStorage para esta entrega.

## 10. Usuarios y contraseñas (bcrypt)
- Antes se usaban credenciales fijas; ahora hay **usuarios reales** en la tabla `User` de PostgreSQL.
- En `/register`, la contraseña se transforma con `bcrypt.hash(password, 10)` antes de guardarse (el `10` son las rondas de sal).
- En `/login`, se compara la contraseña escrita contra el hash guardado con `bcrypt.compare(...)`.
- Nunca se guarda ni se devuelve la contraseña en texto plano. *(Captura de Prisma Studio muestra el hash `$2b$...`.)*

## 11. Rutas protegidas
- Se creó un **middleware** `authMiddleware` que lee `Authorization: Bearer <token>`, lo verifica y deja pasar (`next()`) o corta con **401**.
- Rutas protegidas: `/profile` y **las cuatro de `/tasks`** (GET, POST, PUT, DELETE).
- Consecuencia en el frontend: sin token no se ven las tareas (se muestra la **pantalla de login**), y todas las peticiones de tareas envían el token.

## 12. Evidencias y capturas
Inserta aquí las capturas ordenadas, cada una con una frase que explique qué muestra:
1. Task Manager funcionando en el navegador.
2. Lista de tareas cargadas desde PostgreSQL.
3. Prisma Studio con la tabla `Task` (y `User` con el hash de contraseña).
4. Thunder Client: `GET /tasks` **con** token → 200.
5. Thunder Client: `POST /tasks` **con** token → tarea creada (201).
6. Login devolviendo el **token JWT**.
7. Ruta protegida OK con `Authorization: Bearer <token>` (p. ej. `/profile` o `GET /tasks`).
8. **Error 401** al pedir `/tasks` sin token o con token inválido.
9. Pantalla frontend de login/autenticación.
10. Enlace al repositorio de GitHub.

## 13. Dificultades encontradas
Cuenta problemas reales y cómo los resolviste (elige los que viviste). Ejemplos posibles:
- **CORS**: el frontend no podía llamar al backend hasta habilitar `cors()`.
- **Prisma 7**: la configuración es distinta a la de las guías (driver adapter, cliente generado propio, pnpm).
- **Rutas protegidas**: al proteger `/tasks`, el frontend dejaba de cargar tareas hasta que se agregó el header `Authorization`.
- **Tokens**: entender que el header `Bearer` se necesita en *toda* ruta protegida, no solo en `/profile`.
- **localStorage vs cookie**: decisión de seguridad (ver sección 9).

### 13.b Limitaciones y mejoras futuras (punto fuerte — te distingue)
- **Las tareas no están asociadas a un usuario.** El modelo `Task` no tiene relación con `User` (no hay `userId`), y `/tasks` usa `prisma.task.findMany()` sin filtro. Por eso, hoy cualquier usuario autenticado ve y puede borrar las tareas de todos.
- Esto ilustra la diferencia entre **autenticación** ("¿quién eres?", ya resuelta con JWT) y **autorización** ("¿esto te pertenece?", pendiente).
- **Mejora propuesta:** relación `Task.userId → User` (+ migración); al crear, guardar `userId: req.user.id`; al leer, filtrar `where: { userId: req.user.id }`; al editar/borrar, verificar propiedad antes de actuar. Así cada usuario vería y manejaría **solo sus** tareas.
- Otras mejoras posibles: guardar el token en **cookie httpOnly** (ver §9), validación de datos más estricta, y refresco de token cuando expira.

## 14. Conclusión
- Qué aprendiste sobre **full stack**: cómo se conectan frontend, backend y base de datos.
- Qué aprendiste sobre **persistencia**: los datos viven en PostgreSQL vía Prisma, no en memoria.
- Qué aprendiste sobre **seguridad**: hash de contraseñas con bcrypt y control de acceso con JWT + rutas protegidas.
- Cierre personal: de una app de React simple a una aplicación full stack autenticada.

---

### Referencias (si citas fuentes externas, en formato APA)
- Documentación oficial de React, Express, Prisma, jsonwebtoken, bcryptjs (agrégalas solo si las citaste en el texto).
