type Task = {
  id: number;
  text: string;
  priority: string;
  completed: boolean;
};

type TaskCardProps = {
  task: Task;
  onDeleteTask: (id: number) => void;
  onToggleTask: (id: number) => void;
};

function TaskCard(props: TaskCardProps) {
  return (
    <li
      className={`task-card task-card-${props.task.priority} ${
        props.task.completed ? "completed" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={props.task.completed}
        onChange={() => props.onToggleTask(props.task.id)}
      />

      <span className="task-text">{props.task.text}</span>

      <span className={`badge badge-${props.task.priority}`}>
        {props.task.priority}
      </span>

      <button
        className="delete-button"
        onClick={() => props.onDeleteTask(props.task.id)}
      >
        Eliminar
      </button>
    </li>
  );

export default TaskCard;
