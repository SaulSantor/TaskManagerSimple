const { badRequest, parseBody, send, withCors } = require("../_shared");

const USERS = [
  { id: 1, username: "admin", password: "admin" },
  { id: 2, username: "user1", password: "user1" },
  { id: 3, username: "user2", password: "user2" },
];

async function handler(req, res) {
  if (withCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Método no permitido" });
    return;
  }

  try {
    const body = await parseBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      badRequest(res, "Usuario y contraseña requeridos");
      return;
    }

    const user = USERS.find(
      (item) => item.username === username && item.password === password,
    );
    if (!user) {
      send(res, 401, { ok: false, error: "Credenciales inválidas" });
      return;
    }

    send(res, 200, {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
      },
      token: `demo-${user.id}`,
    });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error.message || "Error al iniciar sesión",
    });
  }
}

module.exports = handler;
