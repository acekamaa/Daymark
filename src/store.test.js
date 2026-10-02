import test from 'node:test';
import assert from 'node:assert/strict';

import { Project, Todo } from './store.js';
import { getStorageReadError, loadProjects, saveProjects } from './storage.js';

function withLocalStorage(storage, callback) {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  try {
    callback();
  } finally {
    if (originalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
}

test('Project.removeTodo removes a todo from the list', () => {
  const project = new Project('Work');
  const todo = new Todo('Ship feature', 'Add the bug fix', '2026-09-02', 'high');

  project.addTodo(todo);
  project.removeTodo(todo);

  assert.deepEqual(project.todos, []);
});

test('Todo.generateFormattedDate returns a readable date string', () => {
  const todo = new Todo('Ship feature', 'Add the bug fix', '2026-09-02', 'high');

  assert.match(todo.generateFormattedDate(), /September 2, 2026|Sep 2, 2026/);
});

test('local storage saves and restores project and todo data', () => {
  const values = new Map();
  withLocalStorage(
    {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    () => {
      const todo = new Todo('Ship feature', 'Add the bug fix', '2026-09-02', 'high', 'completed');
      const projects = [new Project('Work')];
      projects[0].addTodo(todo);

      assert.equal(saveProjects(projects), true);
      assert.deepEqual(loadProjects(), [
        {
          name: 'Work',
          todos: [
            {
              id: todo.id,
              title: 'Ship feature',
              description: 'Add the bug fix',
              dueDate: '2026-09-02',
              priority: 'high',
              status: 'completed',
            },
          ],
        },
      ]);
    }
  );
});

test('empty storage is distinct from an unreadable saved value', () => {
  withLocalStorage(
    {
      getItem: () => null,
      setItem: () => {},
    },
    () => {
      assert.equal(loadProjects(), null);
      assert.equal(getStorageReadError(), '');
    }
  );
});

test('corrupt reads and failed writes are reported', () => {
  withLocalStorage(
    {
      getItem: () => '{invalid json',
      setItem: () => {
        throw new Error('Storage is full');
      },
    },
    () => {
      assert.equal(loadProjects(), null);
      assert.match(getStorageReadError(), /could not be read/i);
      assert.equal(saveProjects([]), false);
    }
  );
});

test('saving reports unavailable storage as a failure', () => {
  withLocalStorage(null, () => {
    assert.equal(saveProjects([]), false);
  });
});
