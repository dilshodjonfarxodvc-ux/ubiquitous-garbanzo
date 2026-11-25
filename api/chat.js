// AI yordamchi: sayt mehmonlarining savollariga javob beradi (Anthropic Claude).
// Vercel > Settings > Environment Variables:
//   ANTHROPIC_API_KEY — https://console.anthropic.com dan oling (kalit faqat serverda turadi, saytda ko’rinmaydi)
//   AI_MODEL          — ixtiyoriy, standart: claude-haiku-5-5 (arzon va tez)
// Narxlar o’zgarsa, pastdagi KNOWLEDGE matnini ham yangilang.

const KNOWLEDGE = `
Sen "Navro’z To’yxonasi" (Jarqo’rg’on tumani, Surxondaryo viloyati, O’zbekiston) saytining yordamchisisan.
Mehmonlarning savollariga qisqa, samimiy va aniq javob ber. Javobni foydalanuvchi yozgan tilda ber (o’zbek, rus yoki ingliz).
Faqat quyidagi ma’lumotlarga tayan. Bilmagan narsangni o’ylab topma: "Bu haqda admin aniq aytadi" de va adminga yozishni taklif qil.
Bron qilish: saytdagi "Bron qilish" tugmasi orqali (zal, sana, mehmonlar soni, xizmatlar tanlanadi). Sen o’zing bron qilmaysan, band sanani aytolmaysan — band sanalar kalendarda ko’rinadi.
Narxlar taxminiy, aniq summa bron oynasida chiqadi. Mavzudan tashqari savollarga (siyosat, dasturlash va h.k.) javob berma, muloyimlik bilan to’yxona mavzusiga qaytar.
Aloqa: telefonlar +998 94 214 50-09 va +998 50 069 90-08; Telegram @Unknown_persoon2; WhatsApp +998 94 214 50-09.

TO’YXONA (narx — butun tadbir uchun, mehmonlar soni uchun alohida pul olinmaydi):
- Katta zal: 600 kishigacha, 12 000 000 so’m. Keng sahna, VIP xona, katta to’xtash joyi.
- O’rta zal: 350 kishigacha, 8 000 000 so’m. Nikoh va katta oilaviy tadbirlar uchun.
- Kichik zal: 150 kishigacha, 4 500 000 so’m. Yaqinlar davrasidagi bazm.
Qo’shimcha xizmatlar (so’m):
- Kelin-kuyov mashinasi: Chevrolet Gentra 300 000; Malibu 500 000; Mercedes E-class 900 000; Limuzin 1 500 000.
- Dekor va gullar: Standart 1 500 000; Premium 2 500 000; Lux 4 500 000.
- Foto va video: faqat foto 1 200 000; foto+video 3 000 000; foto+video+dron 4 500 000.
- Tamada va DJ: faqat DJ 1 000 000; tamada+DJ 2 000 000; mashhur ijrochi bilan 6 000 000.
- Karnay-surnay: 1 soat 500 000; butun tadbir 1 200 000.
- To’y torti: 3 kg 400 000; 6 kg 800 000; 10 kg ko’p qavatli 1 500 000.

TUG’ILGAN KUN (bolalar bayrami; narx — 1 soat uchun, kamida 2 soat bron qilinadi):
- Kichik xona: 30 kishigacha, 400 000 so’m/soat. O’rta xona: 60 kishigacha, 700 000 so’m/soat. Katta zal: 120 kishigacha, 1 200 000 so’m/soat.
- Multfilm qahramonlari (soatiga): Spider-Man 250 000; Elsa 250 000; Mickey Mouse 200 000; Masha va Ayiq 300 000; Minionlar 250 000; Pikachu 250 000.
- Animator (soatiga): 1 ta 200 000; 2 ta 380 000. Akvagrim (soatiga): 150 000.
- Shar va bezak: Standart 600 000; Premium 1 200 000; Mavzuli 1 800 000.
- Tug’ilgan kun torti: 2 kg 250 000; 4 kg 500 000; 6 kg ko’p qavatli 900 000.
- Sehrgar va shou: sehrgar (30 daqiqa) 500 000; sovun pufakchalari shousi 600 000.
- Foto va video: faqat foto 600 000; foto+video 1 200 000.
`;

const hits = new Map(); // oddiy cheklov: bir IP dan daqiqasiga 12 ta so’rov
const limited = (ip) => {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 12;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: "not configured" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  if (limited(ip)) return res.status(429).json({ ok: false, error: "slow down" });

  const raw = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  let msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }))
    .slice(-10);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  // rollar navbatma-navbat bo’lishi kerak
  msgs = msgs.filter((m, i) => i === 0 || m.role !== msgs[i - 1].role);
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return res.status(400).json({ ok: false });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "claude-haiku-5-5", max_tokens: 500, system: KNOWLEDGE, messages: msgs }),
    });
    if (!r.ok) return res.status(502).json({ ok: false });
    const j = await r.json();
    const reply = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    if (!reply) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true, reply });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
