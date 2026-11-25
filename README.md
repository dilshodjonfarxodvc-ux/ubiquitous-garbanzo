# Navro’z To’yxonasi — bron sayti

## Ishga tushirish
    npm install
    npm run dev        # ishlab chiqish: http://localhost:5173
    npm run build      # tayyor sayt dist/ papkasiga chiqadi

## Sozlash (src/App.jsx boshida)
- CFG: to’yxona nomi, telefon, Telegram username
- PHOTOS: rasmlarni public/ papkasiga qo’ying va "/hero.jpg" kabi yozing
- HALLS, MENU, EX: zallar, menyu va qo’shimcha xizmatlar narxlari
- CHARS: multfilm qahramonlari va 1 soatlik narxlari
- BD_HALLS, BD_MENU, BD_EX: "Tug’ilgan kun" sahifasi (narxlar soatiga)
- PHOTOS.bd: tug’ilgan kun sahifasi rasmlari

## Eslatma
Bronlar hozir faqat brauzerda saqlanadi. Haqiqiy ishlashi uchun backend (baza) va admin panel kerak.

## Alternativ
toyxona-javascript.html — bitta fayl, brauzerda ochsangiz ishlaydi.

## Arizalarni Telegramga avtomatik yuborish (Vercel)
1. Loyihani Vercel’ga yuklang (api/bron.js o’zi funksiya bo’ladi).
2. Vercel > Settings > Environment Variables: BOT_TOKEN va CHAT_ID qo’shing (api/bron.js boshidagi izohga qarang).
3. Server bo’lmasa (masalan `npm run dev`) sayt eski usulda ishlaydi: "Telegram orqali yuborish" tugmasi.

## Sozlash: yangi narsalar
- CFG.ig — Instagram username (bo’sh bo’lsa tugma chiqmaydi)
- CFG.mapQ — xaritadagi qidiruv (aniq manzilni yozing)
- Savol-javoblar va "Nega biz" matnlari: T ichida (faq, whyL)
- Mijozlar fikrlarini faqat haqiqiylarini qo’shing.

## Xizmat variantlari rasmlari
src/images/ ichiga quyidagi NOMLAR bilan rasm qo’ying (kengaytma ixtiyoriy: jpg/png/webp) — sayt o’zi topadi:
- Mashina: gentra, malibu, mercedes, limuzin
- Dekor: dekor-standart, dekor-premium, dekor-lux
- Foto: foto, foto-video, foto-dron
- Tamada/DJ: dj, tamada-dj, artist
- Karnay: surnay-1soat, surnay-tadbir
- To’y torti: tort-3kg, tort-6kg, tort-10kg
- Qahramonlar: spiderman, elsa, mickey, masha, minions, pikachu
- Tug’ilgan kun: animator-1, animator-2, shar-standart, shar-premium, shar-mavzu, bd-tort-2kg, bd-tort-4kg, bd-tort-6kg, sehrgar, pufak-shou, akvagrim
Rasm bo’lmasa, o’rniga mashina chizmasi yoki belgi chiqadi. Sichqoncha olib borilsa rasm kattalashadi.

## Logotip
Tug’ilgan kun sahifasida public/happy-birthday.png logotip va brauzer belgisi bo’ladi.

## Backend (bronlarni saqlash)
api/bookings.js — band sanalarni saqlaydi va Telegramga xabar yuboradi. Vercel’da Upstash Redis ulang
(UPSTASH_REDIS_REST_URL va UPSTASH_REDIS_REST_TOKEN), Telegram uchun BOT_TOKEN va CHAT_ID.

## AI yordamchi (savollarga javob beradi)
Saytning pastki chap burchagida "AI yordamchi" tugmasi bor. Backend: api/chat.js.
1. https://console.anthropic.com dan API kalit oling.
2. Vercel > Settings > Environment Variables: ANTHROPIC_API_KEY qo’shing (ixtiyoriy: AI_MODEL).
3. Narxlar o’zgarsa, api/chat.js dagi KNOWLEDGE matnini ham yangilang.
Eslatma: /api papkasi faqat Vercel’da (yoki `npx vercel dev` bilan) ishlaydi. `npm run dev` da yordamchi
"hozir javob bera olmayman, adminga yozing" deydi, admin tugmalari esa ishlaydi.

## Backend (haqiqiy bron tizimi)
- Bron qilingan sana BARCHA foydalanuvchilar uchun qulflanadi (kalendarda 🔒 va chizilgan). Bir sanaga ikki kishi bron qila olmaydi.
- Sahifa band sanalarni har 20 soniyada yangilab turadi. Kalendar joriy oydan 18 oy oldinga ochiladi, o’tgan oylarga qaytib bo’lmaydi.
- **O’z kompyuteringizda:** `.env.example` ni `.env` deb nusxalang, `ADMIN_KEY` ga parol yozing, `npm run dev`.
  Bronlar `data/bookings.json` faylida saqlanadi (backend `npm run dev` ichida o’zi ishlaydi).
- **Vercel'da:** Storage > Upstash Redis ulang (UPSTASH_REDIS_REST_URL va TOKEN avtomatik qo’shiladi), Environment Variables'ga
  `ADMIN_KEY`, `BOT_TOKEN`, `CHAT_ID`, `ANTHROPIC_API_KEY` qo’shing. Redis bo’lmasa Vercel'da bronlar saqlanmaydi.
- **Admin panel:** saytning manzili oxiriga `/#admin` qo’shing (masalan `https://sayt.uz/#admin`), parolni kiriting.
  Ro’yxatda har bir bron (ism, telefon, zal, sana, summa) ko’rinadi; "Sanani bo’shatish" tugmasi sanani qayta ochadi (masalan, bron bekor bo’lsa).

## Telefon uchun (yangilanish)
- Yuqori menyu telefonda ham ko’rinadi (yonga suriladi), bosilganda "suyuq" kapsula animatsiyasi ishlaydi.
- Xizmat rasmini bosib turing — kompyuterdagidek katta ko’rinadi. Rasmni uzoq bosganda Chrome menyusi chiqmaydi.
- src/zallaar rasmlari WebP ga o’tkazilgan va kichraytirilgan (3 MB → 0.9 MB). Yangi rasm qo’shsangiz, uni avval
  squoosh.app da WebP qilib, eng uzun tomonini 1400 px gacha kichraytiring (sifat ~75-80).
- Logotip uchun PNG ishlatsangiz, balandligi kamida 120 px bo’lsin (yoki SVG), aks holda telefonda xira ko’rinadi.
