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

  // Vista activa: "tareas" (Task Manager) o "cuenta" (registro/login/JWT).
  const [view, setView] = useState<"tareas" | "cuenta">("tareas");

  // CARGAR: al iniciar React, pide las tareas guardadas en Postgres.
  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch("http://localhost:3000/tasks");
      const data = await response.json();
      setTasks(data);
    };
    fetchTasks();
  }, []);

  // AGREGAR: manda la nueva tarea al backend (POST) y usa la que responde Postgres.
  const addTask = async (text: string, priority: string) => {
    const response = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const updatedTask = await response.json();

    setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
  };

  // CONTADORES para el footer (se recalculan en cada render, siempre exactos)
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  return (
    <div className="app-container">
      <Header />

      {/* Conmutador entre las dos pantallas del proyecto */}
      <nav className="view-switch">
        <button
          className={view === "tareas" ? "active" : ""}
          onClick={() => setView("tareas")}
        >
          Tareas
        </button>
        <button
          className={view === "cuenta" ? "active" : ""}
          onClick={() => setView("cuenta")}
        >
          Cuenta
        </button>
      </nav>

      {view === "tareas" ? (
        <>
          <TaskInput onAddTask={addTask} />
          <TaskList
            tasks={tasks}
            onDeleteTask={deleteTask}
            onToggleTask={toggleTask}
          />
          <Footer
            total={tasks.length}
            completed={completedTasks}
            pending={pendingTasks}
          />
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;
