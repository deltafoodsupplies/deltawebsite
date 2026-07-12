// Dependency-free smoke server: exercises the same validate.js logic and
// handler decisions as the production Express route, using only Node built-ins.
// Purpose: prove the request flow end-to-end in restricted environments.
import http from "node:http";
import { validateInquiry } from "../src/validate.js";

const hits = new Map(); // naive rate limit mirror: 10 per 15 min per IP

function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 15 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}

const server = http.createServer((req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  if (req.method === "GET" && req.url === "/healthz") {
    return send(200, { ok: true, db: "skipped", uptime: Math.round(process.uptime()) });
  }
  if (req.method === "POST" && req.url === "/api/inquiries") {
    if (rateLimited(req.socket.remoteAddress)) {
      return send(429, { ok: false, error: "Too many submissions — please try again later." });
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 50_000) req.destroy();
    });
    req.on("end", () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        return send(400, { ok: false, errors: ["invalid JSON"] });
      }
      const result = validateInquiry(parsed);
      if (result.isBot) return send(200, { ok: true }); // honeypot: fake success
      if (!result.ok) return send(400, { ok: false, errors: result.errors });
      // production would store in MongoDB + email here
      return send(201, { ok: true, id: null, stored: "skipped (smoke mode)" });
    });
    return;
  }
  send(404, { ok: false, error: "Not found" });
});

server.listen(8080, () => console.log("[smoke] listening on :8080"));
