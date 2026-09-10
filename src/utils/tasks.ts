export type Task = {
  id: number;
  text: string;
  priority: string;
  completed: boolean;
};

export function contarCompletadas(tasks: Task[]): number {
  return tasks.filter((task) => task.completed).length;
}

export function contarPendientes(tasks: Task[]): number {
  return tasks.length - contarCompletadas(tasks);
}
