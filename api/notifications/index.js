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
    if (req.method === "POST") {
      const body = await parseBody(req);
      const userId = Number.parseInt(body.userId, 10);
      const message = String(body.message || "").trim();
      const type = String(body.type || "info").trim() || "info";

      if (!userId) {
        badRequest(res, "userId requerido");
        return;
      }

      if (!message) {
        badRequest(res, "El mensaje es requerido");
        return;
      }

      const notification = {
        id: nextId(
          Array.isArray(body.notifications)
            ? body.notifications
            : Array.isArray(body.collection)
              ? body.collection
              : [],
        ),
        userId,
        message,
        type,
        read: Boolean(body.read),
        createdAt: String(body.createdAt || new Date().toISOString()),
      };

      send(res, 201, { ok: true, notification });
      return;
    }

    if (req.method !== "GET") {
      send(res, 405, { ok: false, error: "Método no permitido" });
      return;
    }

    const data = parseQueryData(req);
    const notifications = Array.isArray(data.notifications)
      ? data.notifications
      : Array.isArray(data.items)
        ? data.items
        : [];
    const userIdValue = data.userId ?? req.query.userId;
    const userId = Number.parseInt(userIdValue, 10);
    const unread =
      String(data.unread ?? req.query.unread ?? "true") !== "false";

    if (userIdValue && !userId) {
      badRequest(res, "userId requerido");
      return;
    }

    const filtered = notifications.filter((notification) => {
      if (userId > 0 && Number(notification.userId) !== userId) {
        return false;
      }

      if (unread && notification.read) {
        return false;
      }

      return true;
    });

    send(res, 200, { ok: true, notifications: filtered });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al procesar notificaciones",
    });
  }
}

module.exports = handler;
