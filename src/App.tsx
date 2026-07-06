import { useEffect, useState } from "react";
//import "./App.css"; innecesario de momento.
import Header from "./components/Header";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import Footer from "./components/Footer";

type Task = {
  id: number;
  text: string;
  priority: string;
  completed: boolean;
};

function App() {
  // El array de tareas empieza VACÍO: las tareas vienen desde el backend.
  const [tasks, setTasks] = useState<Task[]>([]);

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

  // ELIMINAR: deja solo las tareas cuyo id NO sea el que se borra
  const deleteTask = (id: number) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
  };

  // MARCAR/DESMARCAR: invierte "completed" solo en la tarea del id indicado
  const toggleTask = (id: number) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed }; // copia, cambiando completed
      }
      return task; // las demás quedan igual
    });
    setTasks(updatedTasks);
  };

  // CONTADORES para el footer (se recalculan en cada render, siempre exactos)
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  return (
    <div className="app-container">
      <Header />
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
    </div>
  );
}

export default App;
