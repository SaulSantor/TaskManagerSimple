(function () {
  const API_BASE = "/api";

  const DEFAULT_USERS = [
    { id: 1, username: "admin", password: "admin" },
    { id: 2, username: "user1", password: "user1" },
    { id: 3, username: "user2", password: "user2" },
  ];

  const DEFAULT_PROJECTS = [
    { id: 1, name: "Proyecto Demo", description: "Proyecto de ejemplo" },
    { id: 2, name: "Proyecto Alpha", description: "Proyecto importante" },
    { id: 3, name: "Proyecto Beta", description: "Proyecto secundario" },
  ];

  const DEFAULT_TASKS = [
    {
      id: 1,
      title: "Configurar pipeline",
      description: "Preparar el flujo base de despliegue",
      status: "Pendiente",
      priority: "Alta",
      projectId: 1,
      assignedTo: 1,
      dueDate: "2026-06-20",
      estimatedHours: 6,
      actualHours: 0,
      createdBy: 1,
      createdAt: "2026-06-01T08:00:00.000Z",
      updatedAt: "2026-06-01T08:00:00.000Z",
    },
    {
      id: 2,
      title: "Revisar comentarios",
      description: "Validar feedback de los usuarios",
      status: "En Progreso",
      priority: "Media",
      projectId: 2,
      assignedTo: 2,
      dueDate: "2026-06-18",
      estimatedHours: 4,
      actualHours: 1.5,
      createdBy: 2,
      createdAt: "2026-06-02T08:00:00.000Z",
      updatedAt: "2026-06-03T09:30:00.000Z",
    },
    {
      id: 3,
      title: "Cerrar sprint",
      description: "Preparar resumen de entregables",
      status: "Completada",
      priority: "Crítica",
      projectId: 3,
      assignedTo: 3,
      dueDate: "2026-06-10",
      estimatedHours: 8,
      actualHours: 8,
      createdBy: 3,
      createdAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-06-04T09:00:00.000Z",
    },
  ];

  const DEFAULT_COMMENTS = [
    {
      id: 1,
      taskId: 1,
      userId: 2,
      commentText: "Dejo el entorno listo hoy.",
      createdAt: "2026-06-02T10:10:00.000Z",
    },
    {
      id: 2,
      taskId: 2,
      userId: 1,
      commentText: "Revisar la evidencia del cambio.",
      createdAt: "2026-06-03T11:20:00.000Z",
    },
  ];

  const DEFAULT_HISTORY = [
    {
      id: 1,
      taskId: 1,
      userId: 1,
      action: "CREATED",
      oldValue: "",
      newValue: "Configurar pipeline",
      timestamp: "2026-06-01T08:00:00.000Z",
    },
    {
      id: 2,
      taskId: 2,
      userId: 2,
      action: "STATUS_CHANGED",
      oldValue: "Pendiente",
      newValue: "En Progreso",
      timestamp: "2026-06-03T09:30:00.000Z",
    },
    {
      id: 3,
      taskId: 3,
      userId: 3,
      action: "STATUS_CHANGED",
      oldValue: "En Progreso",
      newValue: "Completada",
      timestamp: "2026-06-04T09:00:00.000Z",
    },
  ];

  const DEFAULT_NOTIFICATIONS = [
    {
      id: 1,
      userId: 2,
      message: "Nueva tarea asignada: Revisar comentarios",
      type: "task_assigned",
      read: false,
      createdAt: "2026-06-03T09:30:00.000Z",
    },
    {
      id: 2,
      userId: 3,
      message: "Tarea actualizada: Cerrar sprint",
      type: "task_updated",
      read: false,
      createdAt: "2026-06-04T09:10:00.000Z",
    },
  ];

  const COLLECTION_DEFAULTS = {
    users: DEFAULT_USERS,
    projects: DEFAULT_PROJECTS,
    tasks: DEFAULT_TASKS,
    comments: DEFAULT_COMMENTS,
    history: DEFAULT_HISTORY,
    notifications: DEFAULT_NOTIFICATIONS,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function query(params = {}) {
    const entries = Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );
    return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
  }

  function parseJson(value, fallback = null) {
    if (value == null) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function nextId(items) {
    return (
      items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    );
  }

  const LocalStore = {
    get(key) {
      return parseJson(localStorage.getItem(key), null);
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    },
    ensure(key, fallback) {
      const current = this.get(key);
      if (current !== null && current !== undefined) {
        return current;
      }

      const seeded = clone(fallback);
      this.set(key, seeded);
      return seeded;
    },
    getCollection(key) {
      const value = this.ensure(key, COLLECTION_DEFAULTS[key] || []);
      return Array.isArray(value) ? value : [];
    },
    setCollection(key, value) {
      return this.set(key, Array.isArray(value) ? value : []);
    },
  };

  function seedStore() {
    Object.keys(COLLECTION_DEFAULTS).forEach((key) => {
      LocalStore.ensure(key, COLLECTION_DEFAULTS[key]);
    });
  }

  function toNumber(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function filterTasks(tasks, filters = {}) {
    const text = String(filters.text || filters.search || "")
      .trim()
      .toLowerCase();
    const status = String(filters.status || "").trim();
    const priority = String(filters.priority || "").trim();
    const projectId = toNumber(filters.projectId);
    const assignedTo = toNumber(filters.assignedTo);
    const createdBy = toNumber(filters.createdBy);

    return tasks.filter((task) => {
      if (text) {
        const title = String(task.title || "").toLowerCase();
        const description = String(task.description || "").toLowerCase();
        if (!title.includes(text) && !description.includes(text)) {
          return false;
        }
      }

      if (status && task.status !== status) {
        return false;
      }

      if (priority && task.priority !== priority) {
        return false;
      }

      if (projectId > 0 && Number(task.projectId) !== projectId) {
        return false;
      }

      if (assignedTo > 0 && Number(task.assignedTo) !== assignedTo) {
        return false;
      }

      if (createdBy > 0 && Number(task.createdBy) !== createdBy) {
        return false;
      }

      return true;
    });
  }

  function filterProjects(projects, filters = {}) {
    const text = String(filters.text || filters.search || "")
      .trim()
      .toLowerCase();

    if (!text) {
      return projects;
    }

    return projects.filter((project) => {
      const name = String(project.name || "").toLowerCase();
      const description = String(project.description || "").toLowerCase();
      return name.includes(text) || description.includes(text);
    });
  }

  function appendHistoryEntry(entry) {
    const history = LocalStore.getCollection("history");
    history.push(entry);
    LocalStore.setCollection("history", history);
  }

  function appendNotification(notification) {
    const notifications = LocalStore.getCollection("notifications");
    notifications.push(notification);
    LocalStore.setCollection("notifications", notifications);
  }

  function buildHistoryEntry(task, action, oldValue, newValue) {
    return {
      id: nextId(LocalStore.getCollection("history")),
      taskId: Number(task.id) || 0,
      userId: Number(task.createdBy) || 0,
      action,
      oldValue: oldValue || "",
      newValue: newValue || "",
      timestamp: new Date().toISOString(),
    };
  }

  function buildNotification(userId, message, type) {
    return {
      id: nextId(LocalStore.getCollection("notifications")),
      userId: Number(userId) || 0,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
  }

  function saveTask(task) {
    const tasks = LocalStore.getCollection("tasks");
    const index = tasks.findIndex(
      (item) => Number(item.id) === Number(task.id),
    );
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }

    LocalStore.setCollection("tasks", tasks);
  }

  function saveProject(project) {
    const projects = LocalStore.getCollection("projects");
    const index = projects.findIndex(
      (item) => Number(item.id) === Number(project.id),
    );
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }

    LocalStore.setCollection("projects", projects);
  }

  seedStore();

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Error de red");
    }

    return payload;
  }

  window.TaskManagerAPI = {
    getUsers() {
      return LocalStore.getCollection("users").map(
        ({ password, ...user }) => user,
      );
    },
    login(username, password) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },
    listTasks(filters = {}) {
      return {
        ok: true,
        tasks: filterTasks(LocalStore.getCollection("tasks"), filters),
      };
    },
    async createTask(task) {
      const payload = {
        ...task,
        tasks: LocalStore.getCollection("tasks"),
      };

      const response = await request("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      saveTask(response.task);

      appendHistoryEntry(
        buildHistoryEntry(response.task, "CREATED", "", response.task.title),
      );
      if (Number(response.task.assignedTo) > 0) {
        appendNotification(
          buildNotification(
            response.task.assignedTo,
            `Nueva tarea asignada: ${response.task.title}`,
            "task_assigned",
          ),
        );
      }

      return response;
    },
    async updateTask(id, task) {
      const previousTask = LocalStore.getCollection("tasks").find(
        (item) => Number(item.id) === Number(id),
      ) || { id };

      const response = await request(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(task),
      });

      saveTask(response.task);

      if (
        (previousTask.status || "Pendiente") !==
        (response.task.status || "Pendiente")
      ) {
        appendHistoryEntry(
          buildHistoryEntry(
            response.task,
            "STATUS_CHANGED",
            previousTask.status || "",
            response.task.status || "",
          ),
        );
      }

      if ((previousTask.title || "") !== (response.task.title || "")) {
        appendHistoryEntry(
          buildHistoryEntry(
            response.task,
            "TITLE_CHANGED",
            previousTask.title || "",
            response.task.title || "",
          ),
        );
      }

      if (Number(response.task.assignedTo) > 0) {
        appendNotification(
          buildNotification(
            response.task.assignedTo,
            `Tarea actualizada: ${response.task.title}`,
            "task_updated",
          ),
        );
      }

      return response;
    },
    async deleteTask(id) {
      const previousTask = LocalStore.getCollection("tasks").find(
        (item) => Number(item.id) === Number(id),
      );

      const response = await request(`/tasks/${id}`, {
        method: "DELETE",
      });

      LocalStore.setCollection(
        "tasks",
        LocalStore.getCollection("tasks").filter(
          (item) => Number(item.id) !== Number(id),
        ),
      );
      if (previousTask) {
        appendHistoryEntry(
          buildHistoryEntry(
            previousTask,
            "DELETED",
            previousTask.title || "",
            "",
          ),
        );
      }

      return response;
    },
    listProjects(filters = {}) {
      return {
        ok: true,
        projects: filterProjects(LocalStore.getCollection("projects"), filters),
      };
    },
    async createProject(project) {
      const payload = {
        ...project,
        projects: LocalStore.getCollection("projects"),
      };

      const response = await request("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      saveProject(response.project);
      return response;
    },
    async updateProject(id, project) {
      const response = await request(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(project),
      });

      saveProject(response.project);
      return response;
    },
    async deleteProject(id) {
      const response = await request(`/projects/${id}`, {
        method: "DELETE",
      });

      LocalStore.setCollection(
        "projects",
        LocalStore.getCollection("projects").filter(
          (item) => Number(item.id) !== Number(id),
        ),
      );
      return response;
    },
    listComments(taskId) {
      const comments = LocalStore.getCollection("comments").filter(
        (comment) => !taskId || Number(comment.taskId) === Number(taskId),
      );
      return { ok: true, comments };
    },
    async createComment(comment) {
      const payload = {
        ...comment,
        comments: LocalStore.getCollection("comments"),
      };

      const response = await request("/comments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const comments = LocalStore.getCollection("comments");
      comments.push(response.comment);
      LocalStore.setCollection("comments", comments);
      return response;
    },
    listHistory(taskId) {
      const history = LocalStore.getCollection("history").filter(
        (entry) => !taskId || Number(entry.taskId) === Number(taskId),
      );
      return { ok: true, history };
    },
    listNotifications(userId, unread = true) {
      const notifications = LocalStore.getCollection("notifications").filter(
        (notification) => {
          if (userId && Number(notification.userId) !== Number(userId)) {
            return false;
          }

          if (unread && notification.read) {
            return false;
          }

          return true;
        },
      );

      return { ok: true, notifications };
    },
    markNotificationsRead(userId) {
      const notifications = LocalStore.getCollection("notifications");
      notifications.forEach((notification) => {
        if (!userId || Number(notification.userId) === Number(userId)) {
          notification.read = true;
        }
      });

      LocalStore.setCollection("notifications", notifications);
      return { ok: true, notifications };
    },
    getReport(type) {
      return request(
        `/reports${query({
          type,
          data: JSON.stringify({
            type,
            tasks: LocalStore.getCollection("tasks"),
            projects: LocalStore.getCollection("projects"),
            users: LocalStore.getCollection("users"),
          }),
        })}`,
      );
    },
  };
})();
