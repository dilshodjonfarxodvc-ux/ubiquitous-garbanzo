// Vercel serverless funksiya: sayt arizasini Telegram botga yuboradi.
// Vercel > Settings > Environment Variables ichiga qo’ying:
//   BOT_TOKEN  — @BotFather bergan bot tokeni
//   CHAT_ID    — arizalar keladigan chat ID (o’zingiz botga /start yozing, keyin
//                https://api.telegram.org/bot<TOKEN>/getUpdates ochib "chat":{"id":...} ni oling)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const { BOT_TOKEN, CHAT_ID } = process.env;
  if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok: false, error: "not configured" });
  const text = String((req.body && req.body.text) || "").slice(0, 1500);
  if (text.length < 10) return res.status(400).json({ ok: false });
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: "🔔 " + text }),
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
