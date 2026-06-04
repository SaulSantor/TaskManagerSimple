const { badRequest, nextId, parseBody, send, withCors } = require("../_shared");

function parseQueryData(req) {
  const raw = req.query.data;
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("JSON inválido");
  }
}

function normalizeTask(task) {
  return {
    title: String(task.title || "").trim(),
    description: String(task.description || "").trim(),
    status: String(task.status || "Pendiente"),
    priority: String(task.priority || "Media"),
    projectId: Number.parseInt(task.projectId, 10) || 0,
    assignedTo: Number.parseInt(task.assignedTo, 10) || 0,
    dueDate: String(task.dueDate || "").trim(),
    estimatedHours: Number.parseFloat(task.estimatedHours) || 0,
    actualHours: Number.parseFloat(task.actualHours) || 0,
    createdBy: Number.parseInt(task.createdBy, 10) || 0,
  };
}

function applyTaskFilters(tasks, filters = {}) {
  const text = String(filters.text || filters.search || "")
    .trim()
    .toLowerCase();
  const status = String(filters.status || "").trim();
  const priority = String(filters.priority || "").trim();
  const projectId = Number.parseInt(filters.projectId, 10) || 0;
  const assignedTo = Number.parseInt(filters.assignedTo, 10) || 0;
  const createdBy = Number.parseInt(filters.createdBy, 10) || 0;

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

async function handler(req, res) {
  if (withCors(req, res)) {
    return;
  }

  try {
    if (req.method === "GET") {
      const data = parseQueryData(req);
      const tasks = Array.isArray(data.tasks)
        ? data.tasks
        : Array.isArray(data.items)
          ? data.items
          : [];
      const filters = data.filters || data;
      send(res, 200, { ok: true, tasks: applyTaskFilters(tasks, filters) });
      return;
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const task = normalizeTask(body);

      if (!task.title) {
        badRequest(res, "El título es requerido");
        return;
      }

      const tasks = Array.isArray(body.tasks)
        ? body.tasks
        : Array.isArray(body.collection)
          ? body.collection
          : [];
      const timestamp = new Date().toISOString();
      const storedTask = {
        id: nextId(tasks),
        ...task,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      send(res, 201, {
        ok: true,
        task: storedTask,
      });
      return;
    }

    send(res, 405, { ok: false, error: "Método no permitido" });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al procesar tareas",
    });
  }
}

module.exports = handler;
