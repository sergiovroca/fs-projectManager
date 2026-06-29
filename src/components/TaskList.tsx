import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";

type Task = {
  id: number;
  text: string;
  priority: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  onDeleteTask: (id: number) => void;
  onToggleTask: (id: number) => void;
};

function TaskList(props: TaskListProps) {
  // Si no hay tareas, muestra el mensaje y no sigue
  if (props.tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="task-list">
      {props.tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onDeleteTask={props.onDeleteTask}
          onToggleTask={props.onToggleTask}
        />
      ))}
    </ul>
  );
}

export default TaskList;
