import { useEffect, useState } from "react";
//import "./App.css"; innecesario de momento.
import Header from "./components/Header";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import Footer from "./components/Footer";
import Auth from "./components/Auth";

type Task = {
  id: number;
  text: string;
  priority: string;
  completed: boolean;
};

function App() {
  // El array de tareas empieza VACÍO: las tareas vienen desde el backend.
  const [tasks, setTasks] = useState<Task[]>([]);

  // AUTH: el token vive aquí, en App. Si al iniciar hay uno guardado en
  // localStorage, ya estamos "logueados"; si no, mostramos la pantalla de login.
  const [token, setToken] = useState<string>(localStorage.getItem("token") || "");

  // CARGAR: pide las tareas guardadas en Postgres. Solo tiene sentido cuando hay
  // token, porque /tasks es una ruta PROTEGIDA (sin token responde 401).
  // Depende de "token": al iniciar sesión, vuelve a ejecutarse y trae las tareas.
  useEffect(() => {
    if (!token) return; // sin sesión, no pedimos nada
    const fetchTasks = async () => {
      const response = await fetch("http://localhost:3000/tasks", {
        headers: { Authorization: `Bearer ${token}` }, // 👈 mandamos el token
      });
      // Si el token expiró o es inválido, el backend responde 401 (no un array).
      // En ese caso cerramos sesión y volvemos a la pantalla de login.
      if (!response.ok) {
        localStorage.removeItem("token");
        setToken("");
        return;
      }
      const data = await response.json();
      setTasks(data);
    };
    fetchTasks();
  }, [token]);

  // AGREGAR: manda la nueva tarea al backend (POST) y usa la que responde Postgres.
  const addTask = async (text: string, priority: string) => {
    const response = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 ruta protegida: requiere token
      },
      body: JSON.stringify({ text: text, priority: priority }),
    });
    const newTask = await response.json();
    setTasks([...tasks, newTask]); // agrega al final la tarea creada en la base
  };

  // ELIMINAR: pide al backend borrar la tarea (DELETE) y luego la quita del estado.
  // Así el cambio PERSISTE en PostgreSQL (al recargar, la tarea sigue borrada).
  const deleteTask = async (id: number) => {
    await fetch(`http://localhost:3000/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }, // 👈 ruta protegida
    });
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
  };

  // MARCAR/DESMARCAR: manda al backend el nuevo valor de "completed" (PUT) y usa
  // la tarea actualizada que responde PostgreSQL. También PERSISTE al recargar.
  const toggleTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const response = await fetch(`http://localhost:3000/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 👈 ruta protegida
      },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const updatedTask = await response.json();

    setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
  };

  // CERRAR SESIÓN: borra el token guardado y vuelve a la pantalla de login.
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]); // limpiamos las tareas en pantalla al salir
  };

  // CONTADORES para el footer (se recalculan en cada render, siempre exactos)
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  // AUTH: si NO hay token, mostramos SOLO la pantalla de login/registro.
  // Recién tras un login exitoso (onLogin guarda el token) se ven las tareas.
  if (!token) {
    return (
      <div className="app-container">
        <Header />
        <Auth onLogin={setToken} />
      </div>
    );
  }

  // AUTH: si hay token, mostramos el Task Manager (rutas protegidas) + Cerrar sesión.
  return (
    <div className="app-container">
      <Header />

      <nav className="view-switch">
        <button className="auth-secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </nav>

      <TaskInput onAddTask={addTask} />
      <TaskList tasks={tasks} onDeleteTask={deleteTask} onToggleTask={toggleTask} />
      <Footer
        total={tasks.length}
        completed={completedTasks}
        pending={pendingTasks}
      />
    </div>
  );
}

export default App;
