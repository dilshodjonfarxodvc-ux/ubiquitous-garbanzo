// Bron backend'i: bronlarni saqlaydi, band sanalarni hamma uchun qulflaydi, egasiga Telegramdan xabar yuboradi.
//
// Saqlash joyi (avtomatik tanlanadi):
//   1) Upstash Redis — Vercel'da (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, yoki KV_REST_API_URL + KV_REST_API_TOKEN)
//   2) data/bookings.json fayli — o’z kompyuteringizda (npm run dev / npm run preview) va oddiy serverda
//   3) xotira — Vercel'da Redis ulanmagan bo’lsa (vaqtinchalik! sayt "backend yo’q" deb hisoblaydi)
// Boshqa sozlamalar: BOT_TOKEN, CHAT_ID (Telegram), ADMIN_KEY (admin panel paroli, #admin sahifasi).
//
// Endpoint'lar:
//   GET    /api/bookings            -> { ok, store, booked:[{hall,date}] }   (hamma uchun, shaxsiy ma’lumotsiz)
//   POST   /api/bookings            -> bron yaratadi (sana band bo’lsa 409)
//   GET    /api/bookings?all=1      -> to’liq ro’yxat            (header: x-admin-key)
//   DELETE /api/bookings            -> { hall, date } qulfni ochadi (header: x-admin-key)

import crypto from "node:crypto";

const RURL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const RTOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const HKEY = "bookings"; // Redis hash: maydon "zalId|YYYY-MM-DD" -> JSON
const HALLS = ["a", "b", "c", "ba", "bb", "bc"]; // src/App.jsx dagi HALLS va BD_HALLS id lari

const useRedis = () => Boolean(RURL && RTOKEN);
const redis = async (cmd) => {
  const r = await fetch(RURL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
};

// ---- fayl / xotira ombori ----
const mem = new Map();
let queue = Promise.resolve();
const serial = (fn) => { const p = queue.then(fn); queue = p.catch(() => {}); return p; };
const filePath = async () => {
  const path = await import("node:path");
  return process.env.BOOKINGS_FILE || path.join(process.cwd(), "data", "bookings.json");
};
const canUseFile = () => !process.env.VERCEL; // Vercel'da fayl tizimi faqat o’qish uchun
const readFile = async () => {
  const fs = await import("node:fs/promises");
  try { return JSON.parse(await fs.readFile(await filePath(), "utf8")); } catch { return {}; }
};
const writeFile = async (obj) => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const f = await filePath();
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, JSON.stringify(obj, null, 2), "utf8");
};

const store = {
  persistent: () => useRedis() || canUseFile(),
  async all() {
    if (useRedis()) {
      const r = (await redis(["HGETALL", HKEY])) || [];
      const o = {};
      if (Array.isArray(r)) for (let i = 0; i < r.length; i += 2) { try { o[r[i]] = JSON.parse(r[i + 1]); } catch { /* ignore */ } }
      else Object.entries(r).forEach(([k, v]) => { try { o[k] = JSON.parse(v); } catch { /* ignore */ } });
      return o;
    }
    if (canUseFile()) return serial(readFile);
    return Object.fromEntries(mem);
  },
  async add(key, rec) {
    if (useRedis()) return (await redis(["HSETNX", HKEY, key, JSON.stringify(rec)])) === 1; // atomik
    if (canUseFile()) {
      return serial(async () => { const o = await readFile(); if (o[key]) return false; o[key] = rec; await writeFile(o); return true; });
    }
    if (mem.has(key)) return false;
    mem.set(key, rec);
    return true;
  },
  async del(key) {
    if (useRedis()) return (await redis(["HDEL", HKEY, key])) > 0;
    if (canUseFile()) return serial(async () => { const o = await readFile(); const had = key in o; delete o[key]; await writeFile(o); return had; });
    return mem.delete(key);
  },
};

const validDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return false;
  return d.getTime() >= Date.now() - 36 * 3600 * 1000; // o’tgan sanaga bron yo’q
};

const isAdmin = (req) => {
  const key = process.env.ADMIN_KEY;
  const got = String((req.headers && req.headers["x-admin-key"]) || "");
  if (!key || !got) return false;
  const a = crypto.createHash("sha256").update(key).digest();
  const b = crypto.createHash("sha256").update(got).digest();
  return crypto.timingSafeEqual(a, b);
};

async function notify(text) {
  const { BOT_TOKEN, CHAT_ID } = process.env;
  if (!BOT_TOKEN || !CHAT_ID) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: "🔔 " + text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

// bir IP dan soatiga ko’pi bilan 8 ta bron (oddiy spamdan himoya)
const hits = new Map();
const tooMany = (ip) => {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3600 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 8;
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const query = req.query || {};

  if (req.method === "GET") {
    try {
      const all = await store.all();
      if (query.all) {
        if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
        const list = Object.values(all).sort((a, b) => (a.date < b.date ? -1 : 1));
        return res.status(200).json({ ok: true, store: store.persistent(), bookings: list });
      }
      const booked = Object.keys(all).map((k) => { const [hall, date] = k.split("|"); return { hall, date }; });
      return res.status(200).json({ ok: true, store: store.persistent(), booked });
    } catch {
      return res.status(200).json({ ok: true, store: false, booked: [] });
    }
  }

  if (req.method === "DELETE") {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const b = req.body || {};
    try {
      const had = await store.del(`${clean(b.hall, 4)}|${clean(b.date, 10)}`);
      return res.status(200).json({ ok: true, removed: had });
    } catch {
      return res.status(502).json({ ok: false });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const b = req.body || {};
  const hall = clean(b.hall, 4);
  const date = clean(b.date, 10);
  const name = clean(b.name, 60);
  const phone = clean(b.phone, 25);
  const text = clean(b.text, 1500);
  if (!HALLS.includes(hall) || !validDate(date) || text.length < 10) return res.status(400).json({ ok: false });
  if (name.length < 2 || phone.replace(/\D/g, "").length < 9) return res.status(400).json({ ok: false });
  const ip = String((req.headers && req.headers["x-forwarded-for"]) || "").split(",")[0].trim() || "x";
  if (tooMany(ip)) return res.status(429).json({ ok: false, error: "slow down" });

  let stored = false;
  if (store.persistent()) {
    try {
      const rec = {
        hall, date, name, phone,
        guests: Number(b.guests) || 0,
        total: Number(b.total) || 0,
        text,
        createdAt: new Date().toISOString(),
      };
      const ok = await store.add(`${hall}|${date}`, rec);
      if (!ok) return res.status(409).json({ ok: false, error: "taken" });
      stored = true;
    } catch {
      return res.status(502).json({ ok: false });
    }
  }
  const sent = await notify(text);
  if (!stored && !sent) return res.status(500).json({ ok: false, error: "not configured" });
  return res.status(200).json({ ok: true, stored, sent });
}
