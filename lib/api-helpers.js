function sendJson(res, status, data) {
  res.status(status).json(data);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return {};
}

module.exports = { sendJson, readBody };
