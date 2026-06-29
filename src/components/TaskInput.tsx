import { useState } from "react";

// Este componente recibe UNA función del padre: onAddTask
type TaskInputProps = {
  onAddTask: (text: string, priority: string) => void;
};

function TaskInput(props: TaskInputProps) {
  // Dos "memorias" locales: el texto escrito y la prioridad elegida
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("normal"); // valor inicial

  const handleSubmit = () => {
    if (text.trim() === "") {
      return; // si está vacío (o solo espacios), no hace nada
    }
    props.onAddTask(text, priority); // 👈 AVISA al padre con los datos
    setText("");              // limpia el input
    setPriority("normal");    // vuelve la prioridad al valor por defecto
  };

  return (
    <div className="task-input">
      <input
        type="text"
        placeholder="Escribe una nueva tarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      {/* El selector de prioridad */}
      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
      >
        <option value="alta">Alta</option>
        <option value="normal">Normal</option>
        <option value="baja">Baja</option>
      </select>

      <button onClick={handleSubmit}>Agregar</button>
    </div>
  );
}

export default TaskInput;
