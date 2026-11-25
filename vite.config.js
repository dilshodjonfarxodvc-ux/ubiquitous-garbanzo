import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { pathToFileURL } from "node:url";

// /api/* funksiyalarini (api/bookings.js, api/chat.js, api/bron.js) o’z kompyuteringizda ham ishlatadi:
// `npm run dev` va `npm run preview` da backend Vercel'dagidek ishlaydi. Sozlamalar .env faylidan olinadi.
function localApi(env) {
  Object.assign(process.env, env);
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith("/api/")) return next();
      const u = new URL(req.url, "http://localhost");
      const name = u.pathname.slice(5).replace(/[^a-z0-9_-]/gi, "");
      let mod;
      try {
        mod = await import(pathToFileURL(path.resolve("api", name + ".js")).href + "?t=" + Date.now());
      } catch {
        return next();
      }
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try { req.body = raw && (req.headers["content-type"] || "").includes("json") ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      req.query = Object.fromEntries(u.searchParams);
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return res; };
      try { await mod.default(req, res); } catch (e) { console.error("[api]", name, e); if (!res.writableEnded) res.status(500).json({ ok: false }); }
    });
  };
  return { name: "local-api", configureServer: attach, configurePreviewServer: attach };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(loadEnv(mode, process.cwd(), ""))],
}));
