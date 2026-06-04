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
    if (req.method === "GET") {
      const data = parseQueryData(req);
      const comments = Array.isArray(data.comments)
        ? data.comments
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
        comments: taskId
          ? comments.filter((comment) => Number(comment.taskId) === taskId)
          : comments,
      });
      return;
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const taskId = Number.parseInt(body.taskId, 10);
      const userId = Number.parseInt(body.userId, 10);
      const commentText = String(body.commentText || "").trim();

      if (!taskId) {
        badRequest(res, "ID de tarea requerido");
        return;
      }

      if (!commentText) {
        badRequest(res, "El comentario no puede estar vacío");
        return;
      }

      const comment = {
        id: nextId(
          Array.isArray(body.comments)
            ? body.comments
            : Array.isArray(body.collection)
              ? body.collection
              : [],
        ),
        taskId,
        userId: userId || 0,
        commentText,
        createdAt: new Date().toISOString(),
      };

      send(res, 201, { ok: true, comment });
      return;
    }

    send(res, 405, { ok: false, error: "Método no permitido" });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al procesar comentarios",
    });
  }
}

module.exports = handler;
