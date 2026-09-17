// @ts-nocheck
// Seed reproducible: deja la base con datos de ejemplo conocidos.
// Se puede ejecutar muchas veces seguidas sin duplicar nada:
//   pnpm exec prisma db seed
// (el comando está configurado en prisma.config.ts -> migrations.seed)

require("dotenv/config");

const { PrismaClient } = require("../src/generated/prisma/client.ts");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    // upsert = "actualiza si ya existe, crea si no existe".
    // Por eso la segunda corrida NO crea otra tarea con id 1.
    await prisma.task.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            text: "Tarea de ejemplo para pruebas",
            priority: "normal",
            completed: false,
        },
    });

    // Como creamos la tarea con un id fijo, el contador automático (autoincrement)
    // de PostgreSQL no se entera. Lo sincronizamos con el id más alto; si no,
    // la primera tarea creada desde la app intentaría usar el id 1 y fallaría.
    await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('"Task"', 'id'), (SELECT MAX(id) FROM "Task"))`;

    const total = await prisma.task.count();
    console.log(`Seed aplicado. Tareas en la base: ${total}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
