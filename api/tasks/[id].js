const {
  badRequest,
  notFound,
  parseBody,
  send,
  withCors,
} = require("../_shared");

function normalizeTask(task, fallback = {}) {
  return {
    id: fallback.id,
    title: String(task.title || "").trim(),
    description: String(task.description || "").trim(),
    status: String(task.status || "Pendiente"),
    priority: String(task.priority || "Media"),
    projectId: Number.parseInt(task.projectId, 10) || 0,
    assignedTo: Number.parseInt(task.assignedTo, 10) || 0,
    dueDate: String(task.dueDate || "").trim(),
    estimatedHours: Number.parseFloat(task.estimatedHours) || 0,
    actualHours: Number.parseFloat(task.actualHours) || 0,
    createdBy: fallback.createdBy || 0,
    createdAt: fallback.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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

async function handler(req, res) {
  if (withCors(req, res)) {
    return;
  }

  const id = Number.parseInt(req.query.id, 10);
  if (!id) {
    badRequest(res, "ID inválido");
    return;
  }

  try {
    const data = parseQueryData(req);
    const task = data.task && Number(data.task.id) === id ? data.task : null;

    if (req.method === "GET") {
      if (!task) {
        notFound(res, "Tarea no encontrada");
        return;
      }

      send(res, 200, { ok: true, task });
      return;
    }

    if (req.method === "PUT") {
      const body = await parseBody(req);
      const nextTask = normalizeTask(body, task || { id });

      if (!nextTask.title) {
        badRequest(res, "El título es requerido");
        return;
      }

      send(res, 200, { ok: true, task: nextTask });
      return;
    }

    if (req.method === "DELETE") {
      send(res, 200, { ok: true });
      return;
    }

    send(res, 405, { ok: false, error: "Método no permitido" });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al procesar la tarea",
    });
  }
}

module.exports = handler;
