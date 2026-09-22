// @ts-nocheck

import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, it, expect } from "vitest";
import app from "./app";

// Las rutas de tareas estan protegidas: sin token responden 401.
// Firmamos uno aqui con el mismo secreto que usa el backend.
const token = jwt.sign(
  { id: 1, email: "test@ejemplo.com" },
  process.env.JWT_SECRET || "secret_key",
  { expiresIn: "1h" }
);

describe("POST /tasks", () => {
  it("rechaza una tarea sin texto", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "" });

    expect(res.status).toBe(400);
  });

  it("rechaza un texto que no es una cadena", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: 12345 });

    expect(res.status).toBe(400);
  });
});

describe("GET /health", () => {
  it("responde 200 con status ok para el healthcheck de Railway", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // Sesion 8: el healthcheck tambien informa version y tiempo activo.
  it("informa la version desplegada y los segundos activos", async () => {
    const res = await request(app).get("/health");

    expect(typeof res.body.version).toBe("string");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
