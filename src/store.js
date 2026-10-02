import { format } from 'date-fns';
import { getStorageReadError, loadProjects, saveProjects } from './storage.js';

export class Project {
  constructor(name) {
    this.name = name;
    this.todos = [];
  }

  addTodo(todo) {
    this.todos.push(todo);
  }

  removeTodo(todo) {
    const index = this.todos.indexOf(todo);

    if (index !== -1) {
      this.todos.splice(index, 1);
    }
  }
}

export class Todo {
  constructor(title, description, dueDate, priority, status = 'pending') {
    this.id =
      globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.status = status;
  }

  toggleStatus() {
    this.status = this.status === 'pending' ? 'completed' : 'pending';
  }

  generateFormattedDate() {
    return format(new Date(`${this.dueDate}T00:00:00`), 'MMMM d, yyyy');
  }

  createTodo() {
    return `${this.title} ${this.dueDate} ${this.priority} ${this.status}`;
  }
}

function restoreProject(savedProject) {
  if (
    !savedProject ||
    typeof savedProject.name !== 'string' ||
    !Array.isArray(savedProject.todos)
  ) {
    return null;
  }

  const project = new Project(savedProject.name);
  project.todos = savedProject.todos
    .filter((todo) => todo && typeof todo === 'object')
    .map((todo) => {
      const restoredTodo = new Todo(
        typeof todo.title === 'string' ? todo.title : 'Untitled Todo',
        typeof todo.description === 'string' ? todo.description : '',
        typeof todo.dueDate === 'string' ? todo.dueDate : new Date().toISOString().slice(0, 10),
        ['low', 'medium', 'high'].includes(todo.priority) ? todo.priority : 'low',
        todo.status === 'completed' ? 'completed' : 'pending'
      );
      if (typeof todo.id === 'string') {
        restoredTodo.id = todo.id;
      }
      return restoredTodo;
    });

  return project;
}

const savedProjects = loadProjects();
export const storageLoadError = getStorageReadError();
export const projects =
  savedProjects === null
    ? []
    : savedProjects.map(restoreProject).filter((project) => project !== null);

export const defaultProject =
  savedProjects === null && !storageLoadError
    ? new Project('Default')
    : (projects.find((project) => project.name === 'Default') ?? projects[0] ?? null);

if (savedProjects === null && !storageLoadError) {
  const defaultTodo = new Todo('Welcome', 'This is where your notes goes', '2026-07-24', 'low');
  defaultProject.addTodo(defaultTodo);
  projects.push(defaultProject);
}

export function persistProjects() {
  return saveProjects(projects);
}
