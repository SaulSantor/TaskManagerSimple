const {
  badRequest,
  notFound,
  parseBody,
  send,
  withCors,
} = require("../_shared");

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
    const project =
      data.project && Number(data.project.id) === id ? data.project : null;

    if (req.method === "GET") {
      if (!project) {
        notFound(res, "Proyecto no encontrado");
        return;
      }

      send(res, 200, { ok: true, project });
      return;
    }

    if (req.method === "PUT") {
      const body = await parseBody(req);
      const name = String(body.name || "").trim();
      const description = String(body.description || "").trim();

      if (!name) {
        badRequest(res, "El nombre es requerido");
        return;
      }

      const updatedProject = { id, name, description };

      send(res, 200, { ok: true, project: updatedProject });
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
      error: error.message || "Error al procesar proyectos",
    });
  }
}

module.exports = handler;
