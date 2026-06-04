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

function filterProjects(projects, filters = {}) {
  const text = String(filters.text || filters.search || "")
    .trim()
    .toLowerCase();

  return projects.filter((project) => {
    if (!text) {
      return true;
    }

    const name = String(project.name || "").toLowerCase();
    const description = String(project.description || "").toLowerCase();
    return name.includes(text) || description.includes(text);
  });
}

async function handler(req, res) {
  if (withCors(req, res)) {
    return;
  }

  try {
    if (req.method === "GET") {
      const data = parseQueryData(req);
      const projects = Array.isArray(data.projects)
        ? data.projects
        : Array.isArray(data.items)
          ? data.items
          : [];
      const filters = data.filters || data;
      send(res, 200, { ok: true, projects: filterProjects(projects, filters) });
      return;
    }

    if (req.method === "POST") {
      const body = await parseBody(req);
      const name = String(body.name || "").trim();
      const description = String(body.description || "").trim();

      if (!name) {
        badRequest(res, "El nombre es requerido");
        return;
      }

      const project = {
        id: nextId(
          Array.isArray(body.projects)
            ? body.projects
            : Array.isArray(body.collection)
              ? body.collection
              : [],
        ),
        name,
        description,
      };

      send(res, 201, { ok: true, project });
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
