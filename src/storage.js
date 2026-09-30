const STORAGE_KEY = 'todo-list-app.projects';

export function loadProjects() {
  try {
    const savedProjects = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (savedProjects === null || savedProjects === undefined) {
      return null;
    }

    const projects = JSON.parse(savedProjects);
    return Array.isArray(projects) ? projects : null;
  } catch {
    return null;
  }
}

export function saveProjects(projects) {
  try {
    const savedProjects = projects.map((project) => ({
      name: project.name,
      todos: project.todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        priority: todo.priority,
        status: todo.status,
      })),
    }));

    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}
