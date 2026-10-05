const STORAGE_KEY = 'todo-list-app.projects';
let storageReadError = '';

export function getStorageReadError() {
  return storageReadError;
}

export function loadProjects() {
  storageReadError = '';
  try {
    const storage = globalThis.localStorage;
    if (!storage) {
      storageReadError = 'Browser storage is unavailable. Changes will only last for this session.';
      return null;
    }

    const savedProjects = storage.getItem(STORAGE_KEY);
    if (savedProjects === null) return null;

    const projects = JSON.parse(savedProjects);
    if (!Array.isArray(projects)) {
      storageReadError = 'Saved projects could not be read. Create a new project to continue.';
      return null;
    }

    return projects;
  } catch {
    storageReadError = 'Saved projects could not be read. Changes may only last for this session.';
    return null;
  }
}

export function saveProjects(projects) {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return false;

    const savedProjects = projects.map((project) => ({
      name: project.name,
      todos: project.todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        priority: todo.priority,
        status: todo.status,
        deletedAt: todo.deletedAt,
      })),
    }));

    storage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    return true;
  } catch {
    return false;
  }
}
