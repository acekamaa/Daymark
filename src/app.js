import { Project, persistProjects, projects, storageLoadError, Todo } from './store.js';

const app = document.querySelector('#app');
let selectedProject = null;
let activeFilter = 'all';
let searchTerm = '';
let storageMessage = storageLoadError;

const shell = document.createElement('div');
shell.className = 'app-shell';
const sidebar = document.createElement('aside');
sidebar.className = 'sidebar';
sidebar.innerHTML = `
  <a class="brand" href="#top"><span class="brand-mark" aria-hidden="true">d</span><span>daymark</span></a>
  <p class="sidebar-caption">YOUR WORKSPACE</p>
  <button class="navigation-link is-active" id="all-tasks" type="button"><span class="nav-symbol" aria-hidden="true">◷</span><span>All tasks</span><span class="nav-count"></span></button>
  <div class="project-heading">PROJECTS</div>
  <nav class="project-navigation" aria-label="Projects"></nav>
  <button class="new-project-button" type="button"><span aria-hidden="true">+</span> New project</button>
  <div class="sidebar-footer"><span class="footer-dot" aria-hidden="true"></span><span class="sidebar-user">Your workspace</span></div>`;

const main = document.createElement('main');
main.className = 'main-panel';
main.id = 'top';
main.innerHTML = `
  <header class="topbar"><p class="today-label"></p><div class="topbar-actions"><button class="primary-button new-task-button" type="button"><span aria-hidden="true">+</span> New task</button></div></header>
  <p class="app-notice" role="status" aria-live="polite" hidden></p>
  <section class="page-heading"><p class="eyebrow">A LITTLE MORE CLARITY</p><h1></h1><p class="heading-subtitle"></p></section>
  <section class="stats-grid" aria-label="Task summary">
    <div class="stat-card stat-mint"><strong id="stat-open">0</strong><span>To do</span></div>
    <div class="stat-card stat-yellow"><strong id="stat-done">0</strong><span>Completed</span></div>
    <div class="stat-card stat-coral"><strong id="stat-projects">0</strong><span>Projects</span></div>
  </section>
  <section class="list-section" aria-label="Task list">
    <div class="list-header"><div class="list-title-wrap"><h2>Task list</h2><span class="visible-count"></span></div>
      <div class="task-tools"><label class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" placeholder="Find a task" aria-label="Search tasks"></label>
        <div class="filter-group" role="group" aria-label="Filter tasks">
          <button class="is-active" type="button" data-filter="all" aria-pressed="true">All</button>
          <button type="button" data-filter="open" aria-pressed="false">To do</button>
          <button type="button" data-filter="done" aria-pressed="false">Done</button>
        </div>
      </div>
    </div>
    <div class="task-list"></div>
  </section>`;

shell.append(sidebar, main);

const allTasksButton = sidebar.querySelector('#all-tasks');
const projectNavigation = sidebar.querySelector('.project-navigation');
const headingTitle = main.querySelector('h1');
const headingSubtitle = main.querySelector('.heading-subtitle');
const taskList = main.querySelector('.task-list');
const searchInput = main.querySelector('input[type="search"]');
const filterGroup = main.querySelector('.filter-group');
const visibleCount = main.querySelector('.visible-count');
const statOpen = main.querySelector('#stat-open');
const statDone = main.querySelector('#stat-done');
const statProjects = main.querySelector('#stat-projects');
const appNotice = main.querySelector('.app-notice');

main.querySelector('.today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date());

function button(label, className, handler) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', handler);
  return element;
}

function entriesForAllProjects() {
  return projects.flatMap((project) => project.todos.map((todo) => ({ project, todo })));
}

function saveChanges() {
  storageMessage = persistProjects()
    ? ''
    : 'Changes could not be saved. They will be lost when you leave this browser.';
}

function renderSidebar() {
  allTasksButton.querySelector('.nav-count').textContent = String(
    entriesForAllProjects().filter(({ todo }) => todo.status !== 'completed').length
  );
  allTasksButton.classList.toggle('is-active', selectedProject === null);
  projectNavigation.replaceChildren();

  projects.forEach((project, index) => {
    const item = document.createElement('div');
    item.className = 'project-nav-item';
    const projectButton = document.createElement('button');
    projectButton.type = 'button';
    projectButton.className = `navigation-link project-link${selectedProject === project ? ' is-active' : ''}`;
    const marker = document.createElement('span');
    marker.className = `project-marker marker-${index % 4}`;
    marker.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'project-link-name';
    name.textContent = project.name;
    const count = document.createElement('span');
    count.className = 'nav-count';
    count.textContent = String(project.todos.filter((todo) => todo.status !== 'completed').length);
    projectButton.append(marker, name, count);
    projectButton.addEventListener('click', () => {
      selectedProject = project;
      render();
    });
    const deleteButton = button('×', 'project-remove', () => {
      const projectIndex = projects.indexOf(project);
      if (projectIndex !== -1) projects.splice(projectIndex, 1);
      saveChanges();
      render();
    });
    deleteButton.setAttribute('aria-label', `Delete ${project.name}`);
    item.append(projectButton, deleteButton);
    projectNavigation.append(item);
  });
}

function renderTasks() {
  const source = selectedProject
    ? selectedProject.todos.map((todo) => ({ project: selectedProject, todo }))
    : entriesForAllProjects();
  const entries = source
    .filter(
      ({ todo }) =>
        activeFilter === 'all' ||
        (activeFilter === 'done' ? todo.status === 'completed' : todo.status !== 'completed')
    )
    .filter(({ project, todo }) =>
      `${todo.title} ${todo.description} ${project.name}`.toLowerCase().includes(searchTerm)
    )
    .sort(
      (a, b) =>
        Number(a.todo.status === 'completed') - Number(b.todo.status === 'completed') ||
        a.todo.dueDate.localeCompare(b.todo.dueDate)
    );

  visibleCount.textContent = `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`;
  taskList.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const mark = document.createElement('span');
    mark.className = 'empty-mark';
    mark.textContent = searchTerm ? '⌕' : '✳';
    const title = document.createElement('h3');
    const message = document.createElement('p');
    if (searchTerm) {
      title.textContent = 'No matching tasks';
      message.textContent = 'Try another search or clear the current query.';
    } else if (source.length === 0 && selectedProject) {
      title.textContent = 'This project is empty';
      message.textContent = 'Add a task whenever you are ready to begin.';
    } else if (source.length === 0 && projects.length === 0) {
      title.textContent = 'Start with a project';
      message.textContent = 'Create a project to keep related tasks together.';
    } else if (source.length === 0) {
      title.textContent = 'No tasks yet';
      message.textContent = 'Add a task to one of your projects to get started.';
    } else if (activeFilter === 'done') {
      title.textContent = 'No completed tasks yet';
      message.textContent = 'Completed tasks will appear here.';
    } else {
      title.textContent = 'All caught up';
      message.textContent = 'Everything is complete. Add another task when you are ready.';
    }
    empty.append(mark, title, message);
    if (searchTerm) {
      empty.append(
        button('Clear search', 'text-button', () => {
          searchInput.value = '';
          searchTerm = '';
          renderTasks();
        })
      );
    } else if (source.length === 0 || activeFilter !== 'done') {
      empty.append(
        button(projects.length ? 'Add a task' : 'Create your first project', 'text-button', () => {
          if (projects.length) openTaskDialog(selectedProject ?? projects[0]);
          else openProjectDialog();
        })
      );
    }
    taskList.append(empty);
    return;
  }

  entries.forEach(({ project, todo }, index) => {
    const row = document.createElement('article');
    row.className = `task-row${todo.status === 'completed' ? ' is-complete' : ''}`;
    row.style.animationDelay = `${Math.min(index, 8) * 25}ms`;

    const toggle = button('', 'completion-toggle', () => {
      todo.toggleStatus();
      saveChanges();
      render();
    });
    toggle.setAttribute(
      'aria-label',
      todo.status === 'completed' ? `Reopen ${todo.title}` : `Complete ${todo.title}`
    );
    toggle.setAttribute('aria-pressed', String(todo.status === 'completed'));

    const details = document.createElement('div');
    details.className = 'task-details';
    const title = document.createElement('h3');
    title.textContent = todo.title;
    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = todo.description || 'No notes';
    details.append(title, description);

    const metadata = document.createElement('div');
    metadata.className = 'task-metadata';
    if (!selectedProject) {
      const projectName = document.createElement('span');
      projectName.className = 'task-project';
      projectName.textContent = project.name;
      metadata.append(projectName);
    }
    const date = document.createElement('span');
    date.className = 'task-date';
    date.textContent = todo.generateFormattedDate();
    const priority = document.createElement('span');
    priority.className = `priority-tag priority-${todo.priority}`;
    priority.textContent = todo.priority;
    metadata.append(date, priority);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      button('Edit', 'quiet-button', () => openTaskDialog(project, todo)),
      button('Delete', 'quiet-button delete-button', () => {
        project.removeTodo(todo);
        saveChanges();
        render();
      })
    );
    row.append(toggle, details, metadata, actions);
    taskList.append(row);
  });
}

function render() {
  if (selectedProject && !projects.includes(selectedProject)) selectedProject = null;
  const allTodos = entriesForAllProjects().map(({ todo }) => todo);
  headingTitle.textContent = selectedProject ? selectedProject.name : 'Your tasks';
  headingSubtitle.textContent = selectedProject
    ? `${selectedProject.todos.filter((todo) => todo.status !== 'completed').length} still on your list.`
    : 'Make space for what matters today.';
  statOpen.textContent = String(allTodos.filter((todo) => todo.status !== 'completed').length);
  statDone.textContent = String(allTodos.filter((todo) => todo.status === 'completed').length);
  statProjects.textContent = String(projects.length);
  document.title = `${selectedProject?.name ?? 'Your tasks'} | daymark`;
  appNotice.textContent = storageMessage;
  appNotice.hidden = !storageMessage;
  renderSidebar();
  renderTasks();
}

function field(labelText, control) {
  const label = document.createElement('label');
  label.className = 'form-field';
  const text = document.createElement('span');
  text.textContent = labelText;
  label.append(text, control);
  return label;
}

function requireNonWhitespace(control, message) {
  control.required = true;
  const validate = () => {
    control.setCustomValidity(control.value.trim() ? '' : message);
  };
  control.addEventListener('input', validate);
  control.addEventListener('change', validate);
}

function openDialog(titleText, subtitle, buildFields, save, saveLabel) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove();
  });
  const dialog = document.createElement('section');
  dialog.className = 'dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  const heading = document.createElement('div');
  heading.className = 'dialog-heading';
  const title = document.createElement('h2');
  title.id = 'dialog-title';
  title.textContent = titleText;
  const close = button('×', 'dialog-close', () => overlay.remove());
  close.setAttribute('aria-label', 'Close dialog');
  heading.append(title, close);
  const description = document.createElement('p');
  description.textContent = subtitle;
  const form = document.createElement('form');
  form.className = 'dialog-form';
  const fields = document.createElement('div');
  fields.className = 'dialog-fields';
  buildFields(fields);
  const actions = document.createElement('div');
  actions.className = 'dialog-actions';
  actions.append(button('Cancel', 'secondary-button', () => overlay.remove()));
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary-button';
  submit.textContent = saveLabel;
  actions.append(submit);
  form.append(fields, actions);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    save();
    overlay.remove();
  });
  dialog.append(heading, description, form);
  overlay.append(dialog);
  app.append(overlay);
  fields.querySelector('input, textarea, select')?.focus();
}

function openProjectDialog() {
  const name = document.createElement('input');
  name.type = 'text';
  name.placeholder = 'e.g. Home refresh';
  name.maxLength = 48;
  requireNonWhitespace(name, 'Enter a project name.');
  openDialog(
    'A new project',
    'Give this collection a name.',
    (fields) => {
      fields.append(field('Project name', name));
    },
    () => {
      const project = new Project(name.value.trim());
      projects.push(project);
      selectedProject = project;
      saveChanges();
      render();
    },
    'Create project'
  );
}

function openTaskDialog(project, todo = null) {
  const title = document.createElement('input');
  title.type = 'text';
  title.placeholder = 'What needs doing?';
  title.value = todo?.title ?? '';
  title.maxLength = 120;
  requireNonWhitespace(title, 'Enter a task name.');
  const notes = document.createElement('textarea');
  notes.placeholder = 'Add a note or a little context';
  notes.value = todo?.description ?? '';
  notes.rows = 3;
  const date = document.createElement('input');
  date.type = 'date';
  date.value = todo?.dueDate ?? new Date().toISOString().slice(0, 10);
  date.required = true;
  const priority = document.createElement('select');
  for (const level of ['low', 'medium', 'high']) {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = `${level[0].toUpperCase()}${level.slice(1)} priority`;
    option.selected = (todo?.priority ?? 'medium') === level;
    priority.append(option);
  }
  priority.required = true;
  openDialog(
    todo ? 'Edit task' : 'New task',
    `In ${project.name}`,
    (fields) => {
      fields.append(
        field('Task', title),
        field('Notes', notes),
        field('Due date', date),
        field('Priority', priority)
      );
    },
    () => {
      const updated = new Todo(
        title.value.trim(),
        notes.value.trim(),
        date.value,
        priority.value,
        todo?.status ?? 'pending'
      );
      if (todo) {
        updated.id = todo.id;
        const index = project.todos.indexOf(todo);
        if (index !== -1) project.todos[index] = updated;
      } else {
        project.addTodo(updated);
      }
      saveChanges();
      render();
    },
    todo ? 'Save changes' : 'Add task'
  );
}

allTasksButton.addEventListener('click', () => {
  selectedProject = null;
  render();
});
sidebar.querySelector('.new-project-button').addEventListener('click', openProjectDialog);
main.querySelector('.new-task-button').addEventListener('click', () => {
  const target = selectedProject ?? projects[0];
  if (target) openTaskDialog(target);
  else openProjectDialog();
});
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderTasks();
});
filterGroup.addEventListener('click', (event) => {
  const buttonElement = event.target.closest('button[data-filter]');
  if (!buttonElement) return;
  activeFilter = buttonElement.dataset.filter;
  filterGroup.querySelectorAll('button').forEach((buttonElement) => {
    const isActive = buttonElement.dataset.filter === activeFilter;
    buttonElement.classList.toggle('is-active', isActive);
    buttonElement.setAttribute('aria-pressed', String(isActive));
  });
  renderTasks();
});

app.replaceChildren(shell);
render();
