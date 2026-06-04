function corsHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  Object.entries(corsHeaders()).forEach(([header, value]) =>
    res.setHeader(header, value),
  );
  res.end(JSON.stringify(payload));
}

function withCors(req, res) {
  Object.entries(corsHeaders()).forEach(([header, value]) =>
    res.setHeader(header, value),
  );
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

function badRequest(res, message) {
  send(res, 400, { ok: false, error: message });
}

function notFound(res, message = "Recurso no encontrado") {
  send(res, 404, { ok: false, error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("JSON inválido"));
      }
    });
    req.on("error", reject);
  });
}

function nextId(items) {
  return (
    items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  );
}

module.exports = {
  badRequest,
  nextId,
  notFound,
  parseBody,
  send,
  withCors,
};
