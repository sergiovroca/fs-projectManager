import { useState } from "react";
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
  // El array de tareas. setTasks es la ÚNICA forma de cambiarlo.
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Estudiar React", priority: "alta", completed: false },
    { id: 2, text: "Practicar TypeScript", priority: "normal", completed: false },
    { id: 3, text: "Entender Estado", priority: "baja", completed: true },
  ]);

  // AGREGAR: recibe texto y prioridad (vienen desde TaskInput)
  const addTask = (text: string, priority: string) => {
    const newTask: Task = {
      id: Date.now(),        // número único: los milisegundos de "ahora"
      text: text,
      priority: priority,
      completed: false,      // toda tarea nueva nace pendiente
    };
    setTasks([...tasks, newTask]); // copia las viejas + agrega la nueva al final
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
