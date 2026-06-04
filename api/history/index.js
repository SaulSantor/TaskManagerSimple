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

async function handler(req, res) {
  if (withCors(req, res)) {
    return;
  }

  try {
    if (req.method !== "GET") {
      send(res, 405, { ok: false, error: "Método no permitido" });
      return;
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const taskId = Number.parseInt(body.taskId, 10);
      const userId = Number.parseInt(body.userId, 10);
      const action = String(body.action || "").trim();

      if (!taskId) {
        badRequest(res, "taskId requerido");
        return;
      }

      if (!action) {
        badRequest(res, "action requerida");
        return;
      }

      const entry = {
        id: nextId(
          Array.isArray(body.history)
            ? body.history
            : Array.isArray(body.collection)
              ? body.collection
              : [],
        ),
        taskId,
        userId: userId || 0,
        action,
        oldValue: String(body.oldValue || ""),
        newValue: String(body.newValue || ""),
        timestamp: String(body.timestamp || new Date().toISOString()),
      };

      send(res, 201, { ok: true, history: entry });
      return;
    }

    const data = parseQueryData(req);
    const history = Array.isArray(data.history)
      ? data.history
      : Array.isArray(data.items)
        ? data.items
        : [];
    const taskIdValue = data.taskId ?? req.query.taskId;
    const taskId = Number.parseInt(taskIdValue, 10);

    if (taskIdValue && !taskId) {
      badRequest(res, "taskId inválido");
      return;
    }

    send(res, 200, {
      ok: true,
      history: taskId
        ? history.filter((entry) => Number(entry.taskId) === taskId)
        : history,
    });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al obtener historial",
    });
  }
}

module.exports = handler;
