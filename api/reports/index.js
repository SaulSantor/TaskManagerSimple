const { send, withCors } = require("../_shared");

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

function buildCsv(tasks, projects) {
  let csv = "ID,Título,Estado,Prioridad,Proyecto\n";

  tasks.forEach((task) => {
    const project = projects.find(
      (item) => Number(item.id) === Number(task.projectId),
    );
    const safeTitle = String(task.title || "").replaceAll('"', '""');
    const safeStatus = String(task.status || "Pendiente").replaceAll('"', '""');
    const safePriority = String(task.priority || "Media").replaceAll('"', '""');
    const safeProject = String(
      project ? project.name : "Sin proyecto",
    ).replaceAll('"', '""');

    csv += `${task.id},"${safeTitle}","${safeStatus}","${safePriority}","${safeProject}"\n`;
  });

  return csv;
}

function buildTaskReport(tasks) {
  const statusCount = {};

  tasks.forEach((task) => {
    const status = String(task.status || "Pendiente");
    statusCount[status] = (statusCount[status] || 0) + 1;
  });

  const lines = ["=== REPORTE: TASKS ===", ""];
  Object.keys(statusCount).forEach((status) => {
    lines.push(`${status}: ${statusCount[status]} tareas`);
  });

  return lines.join("\n");
}

function buildProjectsReport(projects, tasks) {
  const lines = ["=== REPORTE: PROJECTS ===", ""];

  projects.forEach((project) => {
    const count = tasks.filter(
      (task) => Number(task.projectId) === Number(project.id),
    ).length;
    lines.push(`${project.name}: ${count} tareas`);
  });

  return lines.join("\n");
}

function buildUsersReport(users, tasks) {
  const lines = ["=== REPORTE: USERS ===", ""];

  users.forEach((user) => {
    const count = tasks.filter(
      (task) => Number(task.assignedTo) === Number(user.id),
    ).length;
    lines.push(`${user.username}: ${count} tareas asignadas`);
  });

  return lines.join("\n");
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

    const data = parseQueryData(req);
    const type = String(data.type || req.query.type || "tasks").toLowerCase();
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const users = Array.isArray(data.users) ? data.users : [];

    if (type === "csv") {
      send(res, 200, {
        ok: true,
        type,
        filename: "export_tasks.csv",
        csv: buildCsv(tasks, projects),
        note: "La exportación CSV se genera desde los datos consumidos por API. En producción conviene mover esta lógica a una capa de exportación persistente.",
      });
      return;
    }

    const text =
      type === "projects"
        ? buildProjectsReport(projects, tasks)
        : type === "users"
          ? buildUsersReport(users, tasks)
          : buildTaskReport(tasks);

    send(res, 200, { ok: true, type, text });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al generar reportes",
    });
  }
}

module.exports = handler;
