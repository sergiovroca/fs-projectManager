# Guía de estudio y presentación — Task Manager Full Stack

> Documento para **entender y explicar el proyecto de principio a fin**: estructura, código,
> flujo, comandos, autenticación y presentación final. Cubre las dos guías del curso:
> *Bcrypt/JWT* y *Presentación final*.

---

## 1. Resumen del proyecto

**Task Manager Full Stack** es una aplicación de tareas que evolucionó de ser solo un frontend en
React a una **aplicación full stack completa**: interfaz en React, servidor en Express, base de datos
PostgreSQL a través de Prisma, y **autenticación real** con contraseñas protegidas (bcrypt) y tokens
(JWT).

**Frase de una línea (para la conclusión):**
> "Nuestra app pasó de ser un Task Manager en React a una aplicación full stack conectada a una base
> de datos y protegida con autenticación JWT."

### Qué hace la app
- Muestra y crea tareas guardadas en PostgreSQL (persisten al recargar).
- Permite **registrar usuarios reales** (pantalla "Cuenta").
- **Inicia sesión** verificando la contraseña contra un hash bcrypt.
- Entrega un **token JWT** al hacer login y lo guarda en el navegador.
- Tiene una **ruta protegida** (`/profile`) que solo responde con un token válido.

---

## 2. Tecnologías utilizadas (versiones reales de ESTE proyecto)

| Capa | Tecnología | Para qué sirve |
|---|---|---|
| Frontend | **React 19** + **Vite 8** + TypeScript | Interfaz de usuario, se ejecuta en el navegador |
| Backend | **Express 5** (Node.js) + TypeScript | Servidor que recibe peticiones y responde JSON |
| ORM | **Prisma 7** (`prisma-client` + adapter `@prisma/adapter-pg`) | Puente entre el backend y PostgreSQL |
| Base de datos | **PostgreSQL** (en Docker, puerto **5435**) | Guarda tareas y usuarios de forma permanente |
| Seguridad | **bcryptjs 3** | Protege las contraseñas convirtiéndolas en hash |
| Tokens | **jsonwebtoken 9** (JWT) | Crea y verifica el token de sesión |
| Gestor de paquetes | **pnpm** | Instala dependencias (más rápido que npm) |

> ⚠️ **Diferencia con las guías del curso:** las guías asumen **Prisma 6 + npm**. Este proyecto usa
> **Prisma 7 + pnpm**, así que los comandos cambian (ver §9). El concepto es idéntico; solo cambia
> *cómo se escriben* los comandos.

---

## 3. Arquitectura y flujo

El flujo completo que hay que saber explicar es:
**React → Express → Prisma → PostgreSQL → JWT**

```
┌─────────────┐   fetch (HTTP)   ┌──────────────┐   prisma.*   ┌──────────┐   SQL   ┌─────────────┐
│   REACT     │ ───────────────► │   EXPRESS    │ ───────────► │  PRISMA  │ ──────► │ PostgreSQL  │
│ (navegador) │ ◄─────────────── │  (servidor)  │ ◄─────────── │  (ORM)   │ ◄────── │  (Docker)   │
│  puerto     │     JSON         │  puerto 3000 │   objetos JS  │          │  filas  │  puerto     │
│  5173       │                  │              │              │          │         │  5435       │
└─────────────┘                  └──────┬───────┘              └──────────┘         └─────────────┘
                                        │
                                        │  Al hacer login correcto:
                                        ▼
                                  ┌──────────────┐
                                  │  JWT (token) │  ── se guarda en localStorage del navegador
                                  └──────────────┘     y se envía en cada ruta protegida como
                                                       "Authorization: Bearer <token>"
```

**En palabras (esto es lo que debes poder decir):**
1. **React** muestra la interfaz y hace peticiones al backend usando `fetch`.
2. **Express** recibe esas peticiones y responde con **JSON**.
3. **Prisma** traduce las órdenes del backend (`prisma.task.findMany()`) a **SQL** y conecta con la base.
4. **PostgreSQL** guarda realmente las tareas y los usuarios.
5. **bcrypt** protege las contraseñas (guarda un *hash*, no el texto).
6. **JWT** genera un token al iniciar sesión; ese token se usa para entrar a rutas protegidas.

---

## 4. Estructura de carpetas

```
fs-projectManager/
├── src/                      ← FRONTEND (React + Vite)
│   ├── main.tsx              ← punto de entrada: monta <App/> en el HTML
│   ├── App.tsx               ← componente raíz: estado, fetch de tareas, conmutador de vista
│   ├── index.css             ← estilos (el CSS "vivo" del proyecto)
│   ├── App.css               ← (vacío / no se usa)
│   └── components/
│       ├── Header.tsx        ← título de la app
│       ├── TaskInput.tsx     ← input + selector de prioridad + botón "Agregar"
│       ├── TaskList.tsx      ← recorre las tareas y pinta una TaskCard por cada una
│       ├── TaskCard.tsx      ← una tarjeta de tarea (checkbox, texto, badge, eliminar)
│       ├── EmptyState.tsx    ← mensaje cuando no hay tareas
│       ├── Footer.tsx        ← contador total / completadas / pendientes
│       └── Auth.tsx          ← ⭐ NUEVA pantalla: registro, login, token y ruta protegida
│
├── backend/                  ← BACKEND (Express + Prisma)
│   ├── src/
│   │   ├── index.ts          ← ⭐ servidor: todas las rutas (tareas + autenticación)
│   │   └── generated/prisma/ ← cliente de Prisma AUTO-GENERADO (no se edita a mano)
│   ├── prisma/
│   │   ├── schema.prisma     ← ⭐ define los modelos Task y User (la "forma" de la BD)
│   │   └── migrations/       ← historial de cambios de la base (SQL versionado)
│   ├── prisma.config.ts      ← config de Prisma 7: dónde está el schema y la URL de la BD
│   ├── .env                  ← DATABASE_URL (conexión a PostgreSQL)
│   └── package.json          ← dependencias del backend + script "dev"
│
├── package.json              ← dependencias del frontend + scripts (dev, build)
└── GUIA_ESTUDIO_Y_PRESENTACION.md   ← este documento
```

⭐ = archivos clave que debes poder explicar.

---

## 5. Backend en detalle (`backend/src/index.ts`)

Este archivo **es el servidor**. Se ejecuta con `pnpm dev` (que corre `ts-node-dev src/index.ts`).

### 5.1 Arranque y configuración
```ts
require("dotenv/config");                 // carga las variables del archivo .env

const express = require("express");       // framework del servidor
const cors = require("cors");             // permite que React (otro puerto) llame al backend
const jwt = require("jsonwebtoken");      // crear/verificar tokens
const bcrypt = require("bcryptjs");       // hashear/comparar contraseñas

const app = express();
const PORT = 3000;                        // el backend escucha en http://localhost:3000

// AUTH: el secreto que firma los tokens vive en .env (no en el código).
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

const { PrismaClient } = require("./generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });   // 'prisma' es la herramienta para hablar con la BD

app.use(cors());          // habilita CORS (si falta, React no puede llamar al backend)
app.use(express.json());  // permite leer req.body como JSON (si falta, req.body llega vacío)
```

**Puntos para explicar:**
- `cors()` y `express.json()` son **middlewares**: se ejecutan en cada petición antes de las rutas.
- La conexión a PostgreSQL se hace con el **adapter** `@prisma/adapter-pg`, usando `DATABASE_URL`.

### 5.2 Rutas de tareas (CRUD) — las 4 conectadas a PostgreSQL
```ts
app.get("/tasks", async (req, res) => {           // LEER todas las tareas
  const tasksFromDatabase = await prisma.task.findMany();
  res.json(tasksFromDatabase);
});

app.post("/tasks", async (req, res) => {          // CREAR una tarea
  const { text, priority } = req.body || {};
  if (!text || text.trim() === "") {
    return res.status(400).json({ message: "Task text is required" });
  }
  const newTask = await prisma.task.create({
    data: { text: text.trim(), priority: priority || "normal", completed: false },
  });
  res.status(201).json(newTask);
});

app.put("/tasks/:id", async (req, res) => {       // ACTUALIZAR (ej: marcar completada)
  const id = Number(req.params.id);
  const { text, completed, priority } = req.body || {};
  try {
    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: { text, completed, priority },   // los campos undefined NO se tocan
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
});

app.delete("/tasks/:id", async (req, res) => {    // BORRAR una tarea
  const id = Number(req.params.id);
  try {
    await prisma.task.delete({ where: { id: id } });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
});
```
- `prisma.task.findMany()` → `SELECT`, `create()` → `INSERT`, `update()` → `UPDATE`, `delete()` → `DELETE`.
- En `update`, si un campo llega `undefined`, Prisma **no lo modifica** (por eso el frontend puede mandar
  solo `{ completed: true }` sin borrar el texto ni la prioridad).
- Los códigos HTTP importan: **200** OK, **201** creado, **400** datos inválidos, **404** no encontrado.
- **El frontend llama a las 4 rutas**, así que crear, completar y borrar **persisten** en la base.

### 5.3 `/register` — crear usuario real (bcrypt) ⭐ NUEVO
```ts
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {                  // 1) validar campos
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const existingUser = await prisma.user.findUnique({  // 2) evitar emails duplicados
    where: { email: email },
  });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);  // 3) HASHEAR (el 10 = rondas de sal)

  const newUser = await prisma.user.create({           // 4) guardar con la contraseña hasheada
    data: { name, email, password: hashedPassword },
  });

  res.status(201).json({                               // 5) responder SIN la contraseña
    message: "User registered successfully",
    user: { id: newUser.id, name: newUser.name, email: newUser.email },
  });
});
```
**Clave:** nunca guardamos la contraseña escrita; guardamos `bcrypt.hash(password, 10)`.

### 5.4 `/login` — verificar usuario real y firmar JWT ⭐ ACTUALIZADO
> Antes usaba credenciales fijas (`admin@test.com` / `123456`). Ahora usa la base de datos.
```ts
app.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });   // 1) buscar usuario
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);  // 2) comparar hash
  if (!passwordIsValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(                              // 3) firmar el token
    { id: user.id, email: user.email },   // payload: qué guardamos DENTRO del token
    JWT_SECRET,                           // secreto que firma el token (viene de .env)
    { expiresIn: "1h" }                   // caduca en 1 hora
  );

  res.json({ message: "Login successful", token, user: { id: user.id, name: user.name, email: user.email } });
});
```
**Clave:** `bcrypt.compare(escrita, hashGuardado)` devuelve `true/false`. No se puede "des-hashear"; solo se compara.

### 5.5 `/profile` — ruta protegida (verifica el token)
```ts
app.get("/profile", (req, res) => {
  const authHeader = req.headers.authorization;       // "Bearer eyJhbG..."
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];             // nos quedamos con el token (quita "Bearer")
  try {
    const decoded = jwt.verify(token, JWT_SECRET);    // valida firma Y caducidad
    res.json({ message: "Protected profile data", user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});
```
**Clave:** sin token → 401 "No token provided"; token inválido/caducado → 401 "Invalid token".

---

## 6. Frontend en detalle (`src/`)

### 6.1 `main.tsx` (punto de entrada)
Monta el componente `<App/>` dentro del `<div id="root">` del `index.html`. Carga `index.css`.

### 6.2 `App.tsx` (componente raíz)
- Guarda el estado de las tareas: `const [tasks, setTasks] = useState<Task[]>([]);`
- Al iniciar, con `useEffect`, **pide las tareas al backend**:
  ```ts
  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch("http://localhost:3000/tasks");
      const data = await response.json();
      setTasks(data);
    };
    fetchTasks();
  }, []);   // [] = se ejecuta una sola vez, al montar
  ```
- `addTask` hace `POST /tasks` y agrega la tarea que devuelve la base.
- `toggleTask` hace `PUT /tasks/:id` mandando `{ completed: !task.completed }` y usa la tarea
  actualizada que responde la base.
- `deleteTask` hace `DELETE /tasks/:id` y luego quita la tarea del estado.
- **Las tres (crear, completar, borrar) llaman al backend, así que persisten al recargar.**
- Tiene un **conmutador de vista** (`view`) entre "Tareas" y "Cuenta":
  ```ts
  const [view, setView] = useState<"tareas" | "cuenta">("tareas");
  ```
  Si `view === "tareas"` muestra el Task Manager; si es `"cuenta"` muestra `<Auth/>`.

### 6.3 Componentes de tareas
- **`Header`**: título.
- **`TaskInput`**: dos estados locales (`text`, `priority`); al pulsar "Agregar" llama `onAddTask` del padre.
- **`TaskList`**: si no hay tareas muestra `<EmptyState/>`; si hay, recorre con `.map()` y pinta una `<TaskCard/>` por tarea (con `key={task.id}`).
- **`TaskCard`**: checkbox (completar), texto, badge de prioridad y botón eliminar. Las clases CSS cambian según prioridad y si está completada.
- **`Footer`**: muestra total / completadas / pendientes (se recalcula en cada render).

### 6.4 `Auth.tsx` ⭐ NUEVO (pantalla de autenticación)
Tres tarjetas:
1. **Registro** (name, email, password) → `POST /register`.
2. **Login** (email, password) → `POST /login`; si funciona:
   ```ts
   localStorage.setItem("token", data.token);   // 👈 guarda el token en el navegador
   ```
3. **Token y ruta protegida**:
   - Botón "Probar /profile" → hace `GET /profile` mandando el token:
     ```ts
     const token = localStorage.getItem("token");
     const response = await fetch("http://localhost:3000/profile", {
       headers: { Authorization: `Bearer ${token}` },
     });
     ```
   - Botón "Cerrar sesión" → `localStorage.removeItem("token")`.

**Idea que hay que saber explicar:** el token se guarda en `localStorage` (memoria del navegador) y se
reenvía en el header `Authorization: Bearer <token>` cada vez que se llama a una ruta protegida.

---

## 7. Base de datos y Prisma

### 7.1 `schema.prisma` (la "forma" de la base)
```prisma
model Task {
  id        Int      @id @default(autoincrement())
  text      String
  priority  String   @default("normal")
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}

model User {                                     // ⭐ modelo agregado para la autenticación
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique                     // no puede haber dos usuarios con el mismo email
  password  String                               // guarda el HASH, no la contraseña
  createdAt DateTime @default(now())
}
```
- `@id @default(autoincrement())` = clave primaria numérica automática.
- `@unique` en email = restricción a nivel de base de datos.

### 7.2 `prisma.config.ts` y `.env`
En Prisma 7 la conexión NO va en el `datasource` del schema, sino en `prisma.config.ts`:
```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```
Y `.env`:
```
DATABASE_URL="postgresql://postgres:maestria123@localhost:5435/taskmanager"
JWT_SECRET="maestria_taskmanager_secreto_2026"
```
- `postgres` = usuario, `maestria123` = contraseña, `localhost:5435` = host:puerto, `taskmanager` = base.
- `JWT_SECRET` = secreto para firmar/verificar los tokens. Está en `.env` (no en el código) porque es
  información privada; en un proyecto real `.env` no se sube al repositorio.

### 7.3 Migraciones
Cada cambio del schema genera una **migración** (un archivo `.sql` versionado en `prisma/migrations/`).
Hay dos: `..._init` (tabla Task) y `..._add_user_model` (tabla User). Así el historial de la base
queda registrado y es reproducible.

### 7.4 El cliente generado (`src/generated/prisma/`)
Al correr `prisma generate`, Prisma crea código TypeScript con métodos tipados: `prisma.task.*` y
`prisma.user.*`. **No se edita a mano**; se regenera cada vez que cambia el schema.

---

## 8. Autenticación explicada (bcrypt + JWT)

### 8.1 bcrypt — proteger contraseñas
- **Problema:** si guardas la contraseña tal cual y roban la base, quedan expuestas.
- **Solución:** guardar un **hash** (cadena irreversible). `bcrypt.hash("123456", 10)` produce algo como
  `$2b$10$y4VUcbadtD4sEdRed2keCe...`
- El `10` son las **rondas de sal** (cost): más alto = más lento = más difícil de atacar por fuerza bruta.
- Para el login se usa `bcrypt.compare(passwordEscrita, hashGuardado)` → `true` o `false`.
- **No existe "des-hashear".** Solo se compara.

### 8.2 JWT — token de sesión
- Al hacer login correcto, el backend **firma** un token: `jwt.sign(payload, secreto, opciones)`.
- El token tiene 3 partes separadas por puntos (`header.payload.signature`) y viaja en texto.
- El **payload** guarda datos no sensibles (aquí: `id` y `email`). ⚠️ *No* se guarda la contraseña.
- El token **caduca** (`expiresIn: "1h"`).
- En una ruta protegida, el backend usa `jwt.verify(token, secreto)`: si la firma es válida y no caducó,
  devuelve el payload; si no, lanza error → 401.
- El cliente manda el token en el header: `Authorization: Bearer <token>`.
- El **secreto** (`JWT_SECRET`) está en `.env`. Es el mismo para firmar (`sign`) y verificar (`verify`);
  si no coinciden, `verify` falla. Guardarlo en `.env` es una buena práctica (no queda en el código).

### 8.3 Diferencia clave para el examen
| Concepto | Qué hace |
|---|---|
| **bcrypt** | Protege la **contraseña** (hash irreversible, se compara). |
| **JWT** | Prueba que el usuario **ya inició sesión** (token firmado con caducidad). |
| **Ruta protegida** | Rechaza (401) si no hay token válido en el header. |

---

## 9. Comandos (adaptados a ESTE proyecto: pnpm + Prisma 7)

### 9.1 Levantar PostgreSQL (Docker, puerto 5435)
```bash
docker start maestria-pg          # arrancar el contenedor si está detenido
docker ps                         # confirmar que aparece "maestria-pg ... 5435->5432"
```

### 9.2 Backend
```bash
# (una sola vez, para instalar dependencias)
pnpm --dir backend install
pnpm --dir backend add bcryptjs           # ya está instalado

# migraciones (cuando cambia el schema)
pnpm --dir backend exec prisma migrate dev --name <nombre>
pnpm --dir backend exec prisma generate   # regenera el cliente

# ver los datos en el navegador (tabla Task y User)
pnpm --dir backend exec prisma studio

# arrancar el servidor (http://localhost:3000)
pnpm --dir backend dev
```
> Estando **dentro** de la carpeta `backend/`, puedes omitir `--dir backend` (ej: `pnpm dev`,
> `pnpm exec prisma studio`).
>
> Equivalencia con las guías: donde dicen `npx prisma@6.19.0 migrate dev` → aquí es
> `pnpm exec prisma migrate dev` (Prisma 7 ya está instalado en el proyecto).

### 9.3 Frontend
```bash
pnpm install                      # (una sola vez) instalar dependencias del frontend
pnpm dev                          # arrancar Vite (http://localhost:5173)
```

---

## 10. Cómo probar todo paso a paso

> Requisito: PostgreSQL arriba + backend (`pnpm dev` en `backend/`) + frontend (`pnpm dev` en la raíz).

### 10.1 Desde el navegador (recomendado para la demo)
1. Abre `http://localhost:5173`.
2. Pestaña **"Tareas"**: verás las tareas que vienen de PostgreSQL. Agrega una nueva, marca una como
   completada (checkbox) y borra otra. **Recarga la página** → los tres cambios **siguen ahí** (persisten
   en la base, porque el frontend llama a `POST`, `PUT` y `DELETE`).
3. Pestaña **"Cuenta"**:
   - **Registro:** nombre + email + contraseña → "Crear cuenta" → mensaje ✅.
   - **Login:** email + contraseña → "Entrar" → mensaje ✅ y se guarda el token.
   - **Probar /profile:** con token → muestra los datos del usuario. Pulsa "Cerrar sesión" y prueba
     otra vez → muestra el error 401 (sin token).

### 10.2 Desde Thunder Client (o curl) — para mostrar el backend
```
POST http://localhost:3000/register   Body JSON: {"name":"Ana","email":"ana@test.com","password":"123456"}
POST http://localhost:3000/login      Body JSON: {"email":"ana@test.com","password":"123456"}
GET  http://localhost:3000/profile    Header: Authorization: Bearer <token del login>
```
Respuestas esperadas (ya verificadas en este proyecto):
- `register` → **201** `{"message":"User registered successfully", ...}`
- `register` repetido → **400** `{"message":"User already exists"}`
- `login` correcto → **200** con `"token": "eyJ..."`
- `login` mala contraseña → **401** `{"message":"Invalid credentials"}`
- `profile` con token → **200** `{"message":"Protected profile data","user":{...}}`
- `profile` sin token → **401** `{"message":"No token provided"}`

### 10.3 Confirmar el hash en la base (Prisma Studio o SQL)
En Prisma Studio, abre la tabla **User**: la columna `password` se ve como una cadena larga
(`$2b$10$...`), **no** como `123456`. Eso demuestra que bcrypt funciona.

---

## 11. Guion de presentación (15 minutos)

| Tiempo | Contenido | Quién |
|---|---|---|
| 2 min | Diapositivas: objetivo, tecnologías, roles de cada integrante | Integrante A |
| 3 min | Arquitectura: diagrama React → Express → Prisma → PostgreSQL → JWT | Integrante B |
| 6 min | **Demo en vivo** (ver orden abajo) | Ambos |
| 2 min | Autenticación: usuarios, bcrypt, JWT, ruta protegida | Integrante A |
| 2 min | Conclusión: dificultades, aprendizajes, mejoras futuras | Integrante B |

**Orden sugerido de la demo (6 min):**
1. Mostrar en VS Code la estructura de carpetas (frontend `src/`, backend `backend/`).
2. `pnpm dev` en backend (mostrar "Server running on port 3000").
3. `pnpm dev` en frontend, abrir `http://localhost:5173`.
4. Mostrar que las **tareas vienen de la base**; agregar una, **marcarla como completada** y **borrar otra**,
   luego **recargar**: los tres cambios se mantienen (persisten en PostgreSQL).
5. Abrir **Prisma Studio** y mostrar la tarea guardada (y cómo cambió `completed`).
6. Ir a **"Cuenta"**: registrar un usuario y mostrarlo en Prisma Studio con la **contraseña hasheada**.
7. Hacer **login** → mostrar que se recibe el **token**.
8. **Probar /profile** con token (funciona) y sin token (error 401).

**Reparto de voz (obligatorio que ambos hablen):** por ejemplo, A explica el **frontend** (React,
componentes, fetch, la pantalla de cuenta) y B explica el **backend** (Express, Prisma, PostgreSQL,
bcrypt, JWT). Ambos deben poder responder preguntas de las dos partes.

**Qué debe tener el PowerPoint:** título + nombres, objetivo, tecnologías, diagrama de flujo,
explicación de Prisma/PostgreSQL, explicación de login/JWT/bcrypt/ruta protegida, capturas del proyecto,
y conclusión.

---

## 12. Preguntas típicas del profesor + respuestas

- **¿Qué es Prisma y por qué lo usan?** Un ORM: nos deja hablar con PostgreSQL usando objetos JS
  (`prisma.task.findMany()`) en vez de escribir SQL a mano; también gestiona las migraciones.
- **¿Qué hace bcrypt exactamente?** Convierte la contraseña en un *hash* irreversible antes de guardarla.
  En el login compara la contraseña escrita contra el hash con `bcrypt.compare`. Nunca guardamos texto plano.
- **¿Por qué el `10` en `bcrypt.hash(password, 10)`?** Son las rondas de sal (cost). A mayor número, más
  lento de calcular y más difícil de atacar por fuerza bruta.
- **¿Qué es un JWT y qué lleva dentro?** Un token firmado que prueba que el usuario inició sesión. Lleva
  un *payload* (aquí `id` y `email`), una fecha de caducidad y una firma. No lleva la contraseña.
- **¿Qué es una ruta protegida?** Una ruta que exige un token válido en `Authorization: Bearer`. Si no
  hay token o es inválido, responde 401.
- **¿Qué pasa si el token caduca?** `jwt.verify` falla y la ruta responde 401 "Invalid token".
- **¿Cómo se conectan frontend y backend?** React hace `fetch` a `http://localhost:3000`; Express responde
  JSON. `cors()` permite que el navegador (puerto 5173) llame al backend (puerto 3000).
- **¿Dónde se guardan los datos?** En PostgreSQL (Docker, puerto 5435), en las tablas `Task` y `User`.
- **¿Qué diferencia hay entre 401 y 400?** 400 = petición mal formada (faltan datos); 401 = no autorizado
  (credenciales o token inválidos).
- **¿Por qué `useEffect(() => {...}, [])`?** El `[]` hace que se ejecute una sola vez, al montar el
  componente: ahí pedimos las tareas iniciales.
- **¿Dónde está el secreto que firma los tokens?** En `backend/.env` como `JWT_SECRET`; el backend lo lee
  con `process.env.JWT_SECRET`. No está escrito en el código. El mismo secreto firma y verifica.
- **¿Cómo persisten borrar y completar una tarea?** El frontend llama a `DELETE /tasks/:id` y a
  `PUT /tasks/:id`; el backend ejecuta `prisma.task.delete` / `prisma.task.update`, así el cambio queda en
  PostgreSQL y se mantiene al recargar.

---

## 13. Errores comunes y solución

| Síntoma | Causa / solución |
|---|---|
| `req.body` llega vacío | Falta `app.use(express.json())`. |
| React no puede llamar al backend (CORS) | Falta `app.use(cors())`. |
| Login siempre dice "Invalid credentials" | Email o contraseña incorrectos; revisar que el usuario exista. |
| No aparece la tabla `User` | Falta correr `pnpm exec prisma migrate dev` y `prisma generate`. |
| `/profile` falla teniendo token | El header debe ser exactamente `Authorization: Bearer <token>`. |
| Backend no conecta a la base | PostgreSQL apagado → `docker start maestria-pg`; revisar puerto 5435 en `.env`. |
| Todas las rutas de Prisma fallan (`PrismaClientKnownRequestError`) | **Docker Desktop cerrado.** Abrir Docker Desktop, esperar a que arranque el daemon y luego `docker start maestria-pg`. |
| `Can't reach database server` | El contenedor no está arriba o el puerto no coincide. |
| Timeout al instalar con pnpm | Problema de red; reintentar (`pnpm install` es idempotente). |

---

## 14. Mejoras aplicadas y limitaciones que quedan

**Ya resuelto (puedes presentarlo como mejora que hicieron):**
- ✅ **Borrar y completar tareas ahora persisten.** `deleteTask` llama a `DELETE /tasks/:id` y `toggleTask`
  a `PUT /tasks/:id`; los cambios se guardan en PostgreSQL y se mantienen al recargar.
- ✅ **El secreto del JWT ya no está en el código:** se movió a `.env` como `JWT_SECRET` y el backend lo lee
  con `process.env.JWT_SECRET`. Se usa el mismo secreto para firmar y verificar.

**Limitaciones menores que aún quedan (sé honesto si preguntan):**
- **La ruta `/profile` no vuelve a leer al usuario de la base:** solo verifica el token y devuelve el
  payload (`id`, `email`). Es suficiente para demostrar el flujo protegido; una mejora sería buscar el
  usuario con `prisma.user.findUnique` y devolver sus datos actualizados.
- **`.env` NO se sube al repositorio** (ya está en `backend/.gitignore`), que es la práctica correcta:
  los secretos (`DATABASE_URL`, `JWT_SECRET`) quedan solo en tu máquina. Consecuencia: si un compañero
  clona el repo, debe crear su propio `backend/.env` con esos valores para que el backend funcione.

---

## 15. Checklist final antes de presentar

- [ ] `docker start maestria-pg` y `docker ps` confirma el puerto 5435.
- [ ] Backend arranca: `pnpm dev` (en `backend/`) muestra "Server running on port 3000".
- [ ] Frontend arranca: `pnpm dev` (en la raíz) abre `http://localhost:5173`.
- [ ] Hay un **usuario de prueba** creado (ej: `ana@test.com` / `123456`).
- [ ] **Thunder Client** con las 3 peticiones listas (register, login, profile).
- [ ] **Prisma Studio** abierto para mostrar tablas `Task` y `User`.
- [ ] **PowerPoint/visual** listo y abierto.
- [ ] **Repositorio de GitHub actualizado** (ver §16).
- [ ] Ambos integrantes saben explicar frontend **y** backend.

---

## 16. Git: dejar el repositorio actualizado

**Estado actual del repo:** rama `main`, con cambios sin commitear y **sin repositorio remoto de GitHub
configurado todavía** (por eso `git push` aún no funciona). `backend/.env` está en `.gitignore`, así que
**no se sube** (correcto).

**Paso 1 — Commit local:**
```bash
git add -A
git commit -m "Auth real (bcrypt+JWT+.env), pantalla de login y CRUD de tareas persistente"
```
> Ojo: los PDF de las guías se borraron de la carpeta. Dos estaban versionados, así que `git add -A`
> registrará su eliminación. Si quieres **conservarlos** en el repo, antes del commit restáuralos:
> `git restore Guia_Implementacion_Bcrypt_Usuarios_JWT.pdf Guia_Presentacion_Final_Task_Manager_Full_Stack_Visual.pdf`

**Paso 2 — Crear el repo en GitHub y conectarlo** (una sola vez):
```bash
# Opción A, con GitHub CLI (crea el repo y sube todo):
gh repo create fs-projectManager --private --source=. --remote=origin --push

# Opción B, manual: crea el repo vacío en github.com y luego:
git remote add origin https://github.com/<tu-usuario>/fs-projectManager.git
git push -u origin main
```

**Paso 3 — En adelante**, para subir cambios basta con:
```bash
git add -A
git commit -m "mensaje"
git push
```

---

## 17. Resumen de todos los cambios

| Cambio | Archivo |
|---|---|
| Instalación de `bcryptjs` | `backend/package.json` |
| Modelo `User` | `backend/prisma/schema.prisma` |
| Migración `add_user_model` | `backend/prisma/migrations/` |
| Import de bcrypt + ruta `/register` + `/login` real | `backend/src/index.ts` |
| `JWT_SECRET` leído desde `.env` (en `sign` y `verify`) | `backend/.env`, `backend/src/index.ts` |
| Pantalla de autenticación | `src/components/Auth.tsx` |
| Conmutador Tareas/Cuenta | `src/App.tsx` |
| `deleteTask` (DELETE) y `toggleTask` (PUT) conectados al backend | `src/App.tsx` |
| Estilos de la pantalla auth | `src/index.css` |

**Frase para cerrar:**
> "Antes el login usaba credenciales fijas. Ahora el sistema registra usuarios reales en PostgreSQL,
> protege sus contraseñas con bcrypt y genera un JWT cuando el login es correcto. Ese token se usa para
> acceder a rutas protegidas."
