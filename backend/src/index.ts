require("dotenv/config");

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");


const app= express();
const PORT = 3000;
const { PrismaClient } = require("./generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());
type Task={
    id: number;
    text: string;
    completed: boolean;
    priority: string;
};
const tasks: Task[] = [
    {id:1 , text:"Estudiar Node.js", completed:false, priority:"normal"},
    {id:2 , text:"Crear servidor Express", completed:true, priority:"normal"},
    {id:3 , text:"Probar las rutas del backend", completed:false, priority:"normal"}
];

app.get("/", (req: any, res:any)=>{
    res.send("Backend is working!");
});

app.post("/login", (req: any, res: any) => {
    const { email, password } = req.body || {};

    // Credenciales de prueba (por ahora, escritas a mano)
    if (email === "admin@test.com" && password === "123456") {
        const token = jwt.sign(
            { email: email },        // 1) qué guardamos DENTRO del token (el payload)
            "secret_key",            // 2) el secreto que FIRMA el token
            { expiresIn: "1h" }      // 3) caduca en 1 hora
        );

        return res.json({
            message: "Login successful",
            token: token,
        });
    }

    // Si no coinciden → 401 (no autorizado)
    res.status(401).json({
        message: "Invalid credentials",
    });
});

app.get("/profile", (req: any, res: any) => {
    // 1) Buscamos el token en el header "Authorization"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    // 2) El header viene como "Bearer eyJ...". Nos quedamos solo con el token.
    const token = authHeader.split(" ")[1];

    try {
        // 3) jwt.verify comprueba la firma Y que no haya caducado
        const decoded = jwt.verify(token, "secret_key");

        res.json({
            message: "Protected profile data",
            user: decoded,
        });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});



app.get("/tasks", async (req: any, res: any) => {
    const tasksFromDatabase = await prisma.task.findMany();
    res.json(tasksFromDatabase);
});


app.post("/tasks", async (req: any, res: any) => {
    const { text, priority } = req.body || {};

    if (!text || text.trim() === "") {
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

app.put("/tasks/:id", async (req: any, res: any) => {
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



app.delete("/tasks/:id", async (req: any, res: any) => {
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


app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})