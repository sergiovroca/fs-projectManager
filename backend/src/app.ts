require("dotenv/config");

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // AUTH: sirve para hashear y comparar contraseñas


const app= express();

// AUTH: el secreto que firma los tokens ahora vive en .env (no en el código).
// El "|| ..." es un valor de respaldo por si faltara la variable de entorno.
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const { PrismaClient } = require("./generated/prisma/client.ts");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get("/", (req: any, res:any)=>{
    res.send("Backend is working!");
});

// AUTH: /register crea un usuario REAL en PostgreSQL.
// AUTH: la contraseña se guarda hasheada (con bcrypt), nunca en texto plano.
app.post("/register", async (req: any, res: any) => {
    const { name, email, password } = req.body || {};

    // 1) Validar que llegaron los tres campos
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required",
        });
    }

    // 2) No permitir dos usuarios con el mismo email (email es @unique en Prisma)
    const existingUser = await prisma.user.findUnique({
        where: { email: email },
    });

    if (existingUser) {
        return res.status(400).json({
            message: "User already exists",
        });
    }

    // 3) Convertir la contraseña en un hash. El 10 = "cost" (rondas de sal).
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4) Guardar el usuario con la contraseña YA hasheada
    const newUser = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword,
        },
    });

    // 5) Devolver el usuario SIN la contraseña
    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
        },
    });
});

// AUTH: /login ahora comprueba usuarios REALES desde PostgreSQL.
// AUTH: bcrypt.compare compara la contraseña escrita contra el hash guardado.
app.post("/login", async (req: any, res: any) => {
    const { email, password } = req.body || {};

    // 1) Validar campos
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }

    // 2) Buscar el usuario por email
    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    // 3) Comparar contraseña escrita vs. hash guardado
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    // 4) Si todo está bien, firmar un JWT que identifica al usuario
    const token = jwt.sign(
        { id: user.id, email: user.email }, // payload: qué guardamos DENTRO del token
        JWT_SECRET,                         // secreto que FIRMA el token (viene de .env)
        { expiresIn: "1h" }                 // caduca en 1 hora
    );

    res.json({
        message: "Login successful",
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    });
});

// AUTH: middleware reutilizable que PROTEGE rutas.
// Verifica el header "Authorization: Bearer <token>". Si el token es válido,
// deja pasar (next()); si falta o es inválido, corta con 401.
function authMiddleware(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }
    // El header viene como "Bearer eyJ...". Nos quedamos solo con el token.
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // guardamos el usuario del token por si la ruta lo necesita
        next();             // token válido → continúa hacia la ruta
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// AUTH: /profile ahora usa el middleware (misma lógica que antes, sin repetir código).
app.get("/profile", authMiddleware, (req: any, res: any) => {
    // El middleware ya verificó el token y dejó el usuario en req.user.
    res.json({
        message: "Protected profile data",
        user: req.user,
    });
});



// RUTAS PROTEGIDAS: las cuatro rutas de tareas llevan authMiddleware como
// segundo argumento. Sin un token válido, el backend responde 401 y no ejecuta
// el handler. Así solo un usuario autenticado puede leer o modificar tareas.
app.get("/tasks", authMiddleware, async (req: any, res: any) => {
    const tasksFromDatabase = await prisma.task.findMany();
    res.json(tasksFromDatabase);
});


app.post("/tasks", authMiddleware, async (req: any, res: any) => {
    const { text, priority } = req.body || {};

    if (typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({
            message: "Task text is required"
        });
    }

    const newTask = await prisma.task.create({
        data: {
            text: text.trim(),
            priority: priority || "normal",
            completed: false
        }
    });

    res.status(201).json(newTask);
});

app.put("/tasks/:id", authMiddleware, async (req: any, res: any) => {
    const id = Number(req.params.id);
    const { text, completed, priority } = req.body || {};

    try {
        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: { text, completed, priority },
        });
        res.json(updatedTask);
    } catch (error) {
        res.status(404).json({ message: "Task not found" });
    }
});



app.delete("/tasks/:id", authMiddleware, async (req: any, res: any) => {
    const id = Number(req.params.id);

    try {
        await prisma.task.delete({
            where: { id: id },
        });
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(404).json({ message: "Task not found" });
    }
});

// Se exporta la app SIN llamar a listen(): asi Supertest puede montarla
// en memoria para las pruebas, sin ocupar un puerto real.
module.exports = app;
