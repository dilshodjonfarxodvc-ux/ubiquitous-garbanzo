import { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./App.css";

// src/ ichidagi istalgan papkadan rasmni NOMI bo’yicha topadi (papka nomi muhim emas).
// Rasm topilmasa, xato bermaydi: bo’sh qoladi.
const FILES = import.meta.glob("./**/*.{png,jpg,jpeg,avif,webp,svg}", { eager: true, import: "default" });
const asset = (name) => {
  let k = Object.keys(FILES).find((p) => p.toLowerCase().endsWith("/" + name.toLowerCase()));
  if (!k) { // rasm .webp ga almashtirilgan bo’lsa ham nomi bo’yicha topadi
    const b = name.toLowerCase().replace(/\.[^.]+$/, "");
    k = Object.keys(FILES).find((p) => p.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase() === b);
  }
  return k ? FILES[k] : "";
};
// Kengaytmasiz nom bo’yicha topadi: "gentra" -> gentra.jpg / gentra.png / gentra.webp ...
const assetBase = (base) => {
  const b = base.toLowerCase();
  const k = Object.keys(FILES).find((p) => p.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase() === b);
  return k ? FILES[k] : "";
};

// ===== SOZLAMALAR: o’zingiznikiga almashtiring =====
const LANGS = ["uz", "ru", "en"];
const CFG = {
  name: ["Navro’z To’yxonasi", "Свадебный дом «Навруз»", "Navro’z Wedding Hall"],
  phones: [["+998942145009", "+998 (94) 214 50-09"], ["+998500699008", "+998 (50) 069 90-08"]],
  tg: "Unknown_persoon2",
  // ADMIN: savol yoki yordam kerak bo’lganda mijoz shu odamga yozadi (Telegram / WhatsApp / qo’ng’iroq)
  admin: { name: "Admin", tg: "Unknown_persoon2", phone: "+998942145009", shown: "+998 (94) 214 50-09" },
  ig: "",            // Instagram username (bo’sh bo’lsa tugma chiqmaydi), masalan "navroz_toyxona"
  mapQ: "Jarqo’rg’on, Surxondaryo",  // xarita qidiruvi: aniq manzil yoki to’yxona nomini yozing
  addr: ["Jarqo’rg’on tumani, Surxondaryo viloyati", "Джаркурганский район, Сурхандарьинская область", "Jarkurgan district, Surkhandarya region"],
};
// ===== Tug’ilgan kun galereyasi (alohida) =====
// 1) rasmlarni src/images/ ga bd-galereya-1.jpg, bd-galereya-2.jpg ... (20 tagacha) nomi bilan qo’ying, yoki
// 2) rasm havolalarini quyidagi ro’yxatga qo’shing. Hech narsa bo’lmasa, vaqtincha xona rasmlari chiqadi.
const BD_GAL_URLS = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTShgALPtkTsLSGLk9Xs1fUSTXLfsct3Qr43y0a6_2MhmNtgwcFfmf2MUje&s=10",
  "https://testov-spb.ru/images/tematik/detskoe_menyu_na_den_rozhdeniya.png",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKyaiAh8QKD1Ly8y0r06zOZtdgzwTeF1mFaPdzF3CACc9XlZPpBLeSLId-&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD0nuI9hzyco4JXJ8XqjG6MDEmKt1jPxqhvjQheTCUviXvw2HN044xTZU&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvW_gRRynNJTuTkpcx99hnIuSutBfVQVnfCf6mbGxQzwddBieo4kkGrbkU&s=10",
  "https://piter.now/imgproxy/Bz9NsWh7qlgcWwd9RHBjbsupJZueNf49KnWpg3-yriQ/rs:fill:950:632/fq:avif:56:jpeg:78:webp:70/cb:s46bz/fn:b3RwcmF6ZG5vdmF0LWRlbi1yb3poZGVuaXlhLXJlYmVua2Etdi1raWV2ZS0x:1/bG9jYWw6Ly8vd3AtY29udGVudC91cGxvYWRzLzIwMjQvMTEvb3RwcmF6ZG5vdmF0LWRlbi1yb3poZGVuaXlhLXJlYmVua2Etdi1raWV2ZS0xLmpwZw",
  "https://vseteplohodi.ru/assets/cache_image/Photos_site/pages_meropriyatiya/17_0x0_065.jpg",
];
const BD_GAL_OWN = [
  ...Array.from({ length: 20 }, (_, i) => assetBase("bd-galereya-" + (i + 1))).filter(Boolean),
  ...BD_GAL_URLS,
];
const PHOTOS = {
  // "Tug’ilgan kun" sahifasi logotipi: public/happy-birthday.png (yoki src ichida happy-birthday.png)
  logoBd: asset("happy-birthday.png") || asset("happy-birthday (1).png") || "/happy-birthday.png",
  logo: asset("two.png"), // logotip: src/images/two.png (bo’lmasa — uzuklar belgisi)
  hero: asset("orig.jpg"),
  a: asset("orig.jpg"),        // Katta zal
  b: asset("images.jpg"),      // O’rta zal
  c: asset("IMG_1910.avif"),   // Kichik zal
  exBg: asset("orig (1).jpg"), // "Qo’shimcha xizmatlar" bo’limining orqa foni (boshqa rasm nomini yozsangiz bo’ladi)
  gal: [
    "orig.jpg", "L_height.webp", "images.jpg", "IMG_1910.avif",
    "L_height (1).webp", "orig (1).jpg", "images (1).jpg", "L_height (2).webp",
  ].map(asset).filter(Boolean),
  // "Tug’ilgan kun" sahifasi rasmlari: o’zingizning rasmlaringiz nomini yozing (src/ ichiga qo’ying)
  bd: {
    hero: asset("IMG_1910.avif"),   // yuqori rasm: eng sifatli, keng rasm
    a: asset("L_height (2).webp"),   // Kichik xona
    b: asset("images (1).jpg"),  // O’rta xona
    c: asset("L_height.webp"),   // Katta zal
    gal: BD_GAL_OWN.length
      ? BD_GAL_OWN
      : ["L_height (2).webp", "IMG_1910.avif", "images (1).jpg", "L_height.webp", "orig (1).jpg", "images.jpg"].map(asset).filter(Boolean),
  },
};

// ===== Matnlar (UZ / RU / EN) =====
const T = {
  uz: {
    zallar: "Zallar", xizmat: "Xizmatlar", galereya: "Galereya", aloqa: "Aloqa", book: "Bron qilish",
    place: "Jarqo’rg’on · Surxondaryo", h1: "Hayotingizdagi eng baxtli kun shu yerda boshlanadi",
    heroP: "3 ta zamonaviy zal, mazali taomlar va to’liq tayyor xizmatlar. Sanani onlayn band qiling.", heroCta: "Sanani band qilish",
    s1: "kishigacha", s2: "ta zal", s3: "yillik tajriba",
    hallsT: "Bizning zallar", hallsSub: "Tadbiringiz hajmiga mos zalni tanlang.",
    exT: "Qo’shimcha xizmatlar", exSub: "Bron paytida istaganingizni qo’shishingiz mumkin.",
    galT: "Galereya", galSub: "Zallarimiz va o’tgan tadbirlardan lavhalar. Kattalashtirish uchun rasmni bosing.",
    from: "dan", bookHall: "Shu zalni band qilish", q: "Savollaringiz bormi?", cSub: "Qo’ng’iroq qiling yoki Telegramda yozing — tez javob beramiz.", call: "Qo’ng’iroq qilish", writeTg: "Telegramda yozish", addrL: "Manzil", tel: "Tel", cur: "so’m",
    modalT: "Bron qilish", hall: "Zal", date: "Sana", pick: "Bo’sh sanani tanlang (üstiga chizilgani band)", picked: "Tanlandi",
    gm: "Mehmonlar", guests: (n) => `Mehmonlar soni (maks. ${n})`, pp: "kishi", extras: "Qo’shimcha xizmatlar", none: "Kerak emas",
    contact: "Aloqa", name: "Ismingiz", phone: "Telefon", total: "Jami (taxminiy)", send: "Ariza yuborish",
    eDate: "Iltimos, sanani tanlang.", eName: "Ismingizni kiriting.", ePhone: "Telefon raqamni to’g’ri kiriting.",
    eCap: (n) => `Bu zalga ${n} kishigacha sig’adi.`, eTaken: "Bu sana hozirgina band qilindi. Boshqa sanani tanlang.", calFree: "Bo’sh", calBusy: "Band", calSel: "Tanlangan",
    doneT: "Ariza qabul qilindi!", soon: "Tez orada siz bilan bog’lanamiz.", viaTg: "Telegram orqali yuborish", copied: "Xabar nusxalandi. Telegramda joylashtiring (Paste).", close: "Yopish",
    prev: "Oldingi", next: "Keyingi", hallRow: "Zal",
    hr: "soat", dur: "Davomiyligi", hrWord: (n) => `${n} soat`, hallHr: (h, n) => `${h} × ${n} soat`, minHr: "Kamida 2 soat",
    modeBd: "🎂 Tug’ilgan kun", modeToy: "💍 To’yxona", perHr: "soat",
    bd: {
      place: "Bolalar bayrami · Jarqo’rg’on", h1: "Farzandingizning tug’ilgan kuni — unutilmas bayram",
      heroP: "Multfilm qahramonlari, shar va bezaklar, mazali tort. Xonani soatbay band qiling.", heroCta: "Bayramni band qilish",
      s1: "kishigacha", s2: "ta xona", s3: "ta qahramon",
      hallsT: "Bayram xonalari", hallsSub: "Mehmonlar soniga mos xonani tanlang. Narx — bir soat uchun.",
      exT: "Bayram xizmatlari", exSub: "Bron paytida istaganingizni qo’shing. Qahramonlar va o’yinlar soatbay hisoblanadi.",
      galT: "Galereya", galSub: "Bayramlardan lavhalar. Kattalashtirish uchun rasmni bosing.", bookHall: "Shu xonani band qilish", heroBook: "Bayramni band qilish",
      faq: [
        ["Bronni qanday qilaman?", "«Bron qilish» tugmasini bosing, xona, sana va davomiylikni tanlang, ismingiz va telefoningizni qoldiring."],
        ["Narx qanday hisoblanadi?", "Xona narxi bir soat uchun, kamida 2 soat bron qilinadi. Qahramonlar va animatorlar ham soatbay hisoblanadi. Mehmonlar soni uchun alohida pul olinmaydi."],
        ["Band sanani qanday bilaman?", "Kalendarda band kunlar chizib qo’yilgan, ularni tanlab bo’lmaydi."],
        ["Savolim bo’lsa-chi?", "Aloqa bo’limidagi raqamlarga qo’ng’iroq qiling yoki Telegram, WhatsApp orqali yozing."],
      ],
      modalT: "Tug’ilgan kun broni", hall: "Xona", hallRow: "Xona",
    },
    aiTitle: "AI yordamchi", aiHello: "Salom! Men yordamchiman. Narxlar, zallar, xizmatlar va bron haqida so’rang.", aiPh: "Savolingizni yozing…", aiErr: "Hozir javob bera olmayman. Iltimos, adminga yozing.", aiBtn: "AI yordamchi",
    adminT: "Admin bilan bog’lanish", adminSub: "Savol yoki yordam kerakmi? Adminga yozing — tez javob beramiz.", adminBtn: "Adminga yozish", adminLbl: "Admin", adminMsg: "Assalomu alaykum! Savolim bor.",
    whyT: "Nega aynan biz", whyL: [
      ["Onlayn bron", "Sanani kalendardan tanlab, bir necha daqiqada ariza qoldiring."],
      ["Ochiq narxlar", "Barcha narxlar sahifada ko’rsatilgan, jami summani oldindan ko’rasiz."],
      ["Tayyor xizmatlar", "Kerakli qo’shimcha xizmatlarni bron paytida qo’shasiz."],
      ["3 xil zal", "Tadbiringiz hajmiga mos zalni tanlang."],
    ],
    faqT: "Ko’p so’raladigan savollar", faq: [
      ["Bronni qanday qilaman?", "«Bron qilish» tugmasini bosing, zal va sanani tanlang, ismingiz va telefoningizni qoldiring. Biz siz bilan bog’lanamiz."],
      ["Narx qanday hisoblanadi?", "Zal narxiga tanlagan qo’shimcha xizmatlaringiz qo’shiladi. Mehmonlar soni uchun alohida pul olinmaydi. Jami summa bron oynasida taxminiy ko’rsatiladi."],
      ["Band sanani qanday bilaman?", "Kalendarda band kunlar chizib qo’yilgan, ularni tanlab bo’lmaydi."],
      ["Savolim bo’lsa-chi?", "Aloqa bo’limidagi raqamlarga qo’ng’iroq qiling yoki Telegram, WhatsApp orqali yozing."],
    ],
    route: "Yo’l ko’rsatish", wa: "WhatsApp’da yozish", sentOk: "Arizangiz bizga yuborildi.", sending: "Yuborilmoqda…",
    months: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    dw: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
  },
  ru: {
    zallar: "Залы", xizmat: "Услуги", galereya: "Галерея", aloqa: "Контакты", book: "Забронировать",
    place: "Джаркурган · Сурхандарья", h1: "Самый счастливый день вашей жизни начинается здесь",
    heroP: "3 современных зала, вкусная кухня и готовые услуги под ключ. Забронируйте дату онлайн.", heroCta: "Забронировать дату",
    s1: "гостей", s2: "зала", s3: "лет опыта",
    hallsT: "Наши залы", hallsSub: "Выберите зал под размер вашего праздника.",
    exT: "Дополнительные услуги", exSub: "Вы можете добавить любые услуги при бронировании.",
    galT: "Галерея", galSub: "Наши залы и кадры с прошедших праздников. Нажмите на фото, чтобы увеличить.",
    from: "от", bookHall: "Забронировать этот зал", q: "Есть вопросы?", cSub: "Позвоните или напишите в Telegram — мы быстро ответим.", call: "Позвонить", writeTg: "Написать в Telegram", addrL: "Адрес", tel: "Тел", cur: "сум",
    modalT: "Бронирование", hall: "Зал", date: "Дата", pick: "Выберите свободную дату (зачёркнутые заняты)", picked: "Выбрано",
    gm: "Гости", guests: (n) => `Количество гостей (макс. ${n})`, pp: "гостя", extras: "Дополнительные услуги", none: "Не нужно",
    contact: "Контакты", name: "Ваше имя", phone: "Телефон", total: "Итого (примерно)", send: "Отправить заявку",
    eDate: "Пожалуйста, выберите дату.", eName: "Введите ваше имя.", ePhone: "Введите корректный номер телефона.",
    eCap: (n) => `В этот зал помещается до ${n} гостей.`, eTaken: "Эта дата только что занята. Выберите другую.", calFree: "Свободно", calBusy: "Занято", calSel: "Выбрано",
    doneT: "Заявка принята!", soon: "Мы скоро свяжемся с вами.", viaTg: "Отправить через Telegram", copied: "Сообщение скопировано. Вставьте его в Telegram.", close: "Закрыть",
    prev: "Назад", next: "Вперёд", hallRow: "Зал",
    hr: "ч", dur: "Продолжительность", hrWord: (n) => `${n} ч`, hallHr: (h, n) => `${h} × ${n} ч`, minHr: "Минимум 2 часа",
    modeBd: "🎂 День рождения", modeToy: "💍 Свадьба", perHr: "час",
    bd: {
      place: "Детский праздник · Джаркурган", h1: "День рождения вашего ребёнка — незабываемый праздник",
      heroP: "Герои мультфильмов, шары и декор, вкусный торт. Бронируйте зал почасово.", heroCta: "Забронировать праздник",
      s1: "гостей", s2: "зала", s3: "героев",
      hallsT: "Залы для праздника", hallsSub: "Выберите зал под количество гостей. Цена — за один час.",
      exT: "Услуги для праздника", exSub: "Добавьте всё нужное при бронировании. Герои и игры считаются почасово.",
      galT: "Галерея", galSub: "Кадры с праздников. Нажмите на фото, чтобы увеличить.", bookHall: "Забронировать этот зал", heroBook: "Забронировать праздник",
      faq: [
        ["Как забронировать?", "Нажмите «Забронировать», выберите комнату, дату и длительность, оставьте имя и телефон."],
        ["Как считается цена?", "Цена комнаты указана за один час, минимум 2 часа. Герои и аниматоры тоже считаются почасово. За количество гостей отдельная плата не взимается."],
        ["Как узнать, что дата занята?", "Занятые дни зачёркнуты в календаре, их нельзя выбрать."],
        ["Остались вопросы?", "Позвоните по номерам из раздела контактов или напишите в Telegram, WhatsApp."],
      ],
      modalT: "Бронь дня рождения", hall: "Комната", hallRow: "Комната",
    },
    aiTitle: "ИИ-помощник", aiHello: "Здравствуйте! Я помощник. Спросите о ценах, залах, услугах и брони.", aiPh: "Напишите вопрос…", aiErr: "Сейчас не могу ответить. Пожалуйста, напишите админу.", aiBtn: "ИИ-помощник",
    adminT: "Связаться с админом", adminSub: "Нужна помощь или есть вопрос? Напишите админу — быстро ответим.", adminBtn: "Написать админу", adminLbl: "Админ", adminMsg: "Здравствуйте! У меня вопрос.",
    whyT: "Почему мы", whyL: [
      ["Онлайн-бронь", "Выберите дату в календаре и оставьте заявку за пару минут."],
      ["Открытые цены", "Все цены указаны на сайте, итоговую сумму видно заранее."],
      ["Готовые услуги", "Нужные дополнительные услуги добавляются при бронировании."],
      ["3 зала", "Выберите зал под размер вашего праздника."],
    ],
    faqT: "Частые вопросы", faq: [
      ["Как забронировать?", "Нажмите «Забронировать», выберите зал и дату, оставьте имя и телефон. Мы свяжемся с вами."],
      ["Как считается цена?", "К цене зала добавляются выбранные дополнительные услуги. За количество гостей отдельная плата не взимается. Итог в окне бронирования показан примерно."],
      ["Как узнать, что дата занята?", "Занятые дни зачёркнуты в календаре, их нельзя выбрать."],
      ["Остались вопросы?", "Позвоните по номерам из раздела контактов или напишите в Telegram, WhatsApp."],
    ],
    route: "Проложить маршрут", wa: "Написать в WhatsApp", sentOk: "Ваша заявка отправлена.", sending: "Отправка…",
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    dw: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  },
  en: {
    zallar: "Halls", xizmat: "Services", galereya: "Gallery", aloqa: "Contact", book: "Book now",
    place: "Jarkurgan · Surkhandarya", h1: "The happiest day of your life starts here",
    heroP: "3 modern halls, delicious food and ready-made services. Reserve your date online.", heroCta: "Reserve a date",
    s1: "guests", s2: "halls", s3: "years of experience",
    hallsT: "Our halls", hallsSub: "Choose the hall that fits your event.",
    exT: "Extra services", exSub: "Add anything you like while booking.",
    galT: "Gallery", galSub: "Our halls and moments from past events. Tap a photo to enlarge it.",
    from: "from", bookHall: "Book this hall", q: "Have questions?", cSub: "Call us or message on Telegram — we reply quickly.", call: "Call", writeTg: "Message on Telegram", addrL: "Address", tel: "Tel", cur: "UZS",
    modalT: "Booking", hall: "Hall", date: "Date", pick: "Pick a free date (crossed-out dates are taken)", picked: "Selected",
    gm: "Guests", guests: (n) => `Number of guests (max. ${n})`, pp: "guest", extras: "Extra services", none: "Not needed",
    contact: "Contact", name: "Your name", phone: "Phone", total: "Total (estimate)", send: "Send request",
    eDate: "Please pick a date.", eName: "Enter your name.", ePhone: "Enter a valid phone number.",
    eCap: (n) => `This hall holds up to ${n} guests.`, eTaken: "This date was just booked. Please pick another one.", calFree: "Free", calBusy: "Booked", calSel: "Selected",
    doneT: "Request received!", soon: "We will contact you shortly.", viaTg: "Send via Telegram", copied: "Message copied. Paste it in Telegram.", close: "Close",
    prev: "Previous", next: "Next", hallRow: "Hall",
    hr: "h", dur: "Duration", hrWord: (n) => `${n} h`, hallHr: (h, n) => `${h} × ${n} h`, minHr: "Minimum 2 hours",
    modeBd: "🎂 Birthday", modeToy: "💍 Wedding hall", perHr: "hour",
    bd: {
      place: "Kids’ party · Jarkurgan", h1: "Your child’s birthday — a party to remember",
      heroP: "Cartoon characters, balloons and decor, a tasty cake. Book the room by the hour.", heroCta: "Book the party",
      s1: "guests", s2: "rooms", s3: "characters",
      hallsT: "Party rooms", hallsSub: "Pick a room that fits your guest count. Prices are per hour.",
      exT: "Party services", exSub: "Add anything you like while booking. Characters and games are charged by the hour.",
      galT: "Gallery", galSub: "Moments from parties. Tap a photo to enlarge it.", bookHall: "Book this room", heroBook: "Book the party",
      faq: [
        ["How do I book?", "Press “Book the party”, choose a room, a date and the duration, and leave your name and phone."],
        ["How is the price calculated?", "Room prices are per hour, with a 2-hour minimum. Characters and animators are also charged by the hour. There is no extra charge per guest."],
        ["How do I know a date is taken?", "Taken days are crossed out in the calendar and cannot be selected."],
        ["Still have questions?", "Call the numbers in the contact section or write on Telegram or WhatsApp."],
      ],
      modalT: "Birthday booking", hall: "Room", hallRow: "Room",
    },
    aiTitle: "AI assistant", aiHello: "Hello! I’m the assistant. Ask about prices, halls, services and booking.", aiPh: "Type your question…", aiErr: "I can’t answer right now. Please message the admin.", aiBtn: "AI assistant",
    adminT: "Contact the admin", adminSub: "Need help or have a question? Message our admin — we reply quickly.", adminBtn: "Message the admin", adminLbl: "Admin", adminMsg: "Hello! I have a question.",
    whyT: "Why choose us", whyL: [
      ["Online booking", "Pick a date in the calendar and send a request in minutes."],
      ["Clear prices", "All prices are on the page, so you see the total upfront."],
      ["Ready-made services", "Add any extra services while booking."],
      ["3 halls", "Choose the hall that fits your event."],
    ],
    faqT: "Frequently asked questions", faq: [
      ["How do I book?", "Press “Book now”, choose a hall and a date, and leave your name and phone. We will contact you."],
      ["How is the price calculated?", "The hall price plus the extra services you choose. There is no extra charge per guest. The total in the booking window is an estimate."],
      ["How do I know a date is taken?", "Taken days are crossed out in the calendar and cannot be selected."],
      ["Still have questions?", "Call the numbers in the contact section or write on Telegram or WhatsApp."],
    ],
    route: "Get directions", wa: "Message on WhatsApp", sentOk: "Your request has been sent.", sending: "Sending…",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    dw: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  },
};

// ===== Ma’lumotlar: [uz, ru, en] =====
const HALLS = [
  { id: "a", name: ["Katta zal", "Большой зал", "Grand hall"], cap: 600, price: 12000000, pal: ["#a63d24", "#f0b87a"],
    desc: ["600 kishigacha. Keng sahna, VIP xona, katta to’xtash joyi.", "До 600 гостей. Просторная сцена, VIP-комната, большая парковка.", "Up to 600 guests. Wide stage, VIP room, large parking."] },
  { id: "b", name: ["O’rta zal", "Средний зал", "Medium hall"], cap: 350, price: 8000000, pal: ["#2f5d62", "#e6c27a"],
    desc: ["350 kishigacha. Nikoh va katta oilaviy tadbirlar uchun.", "До 350 гостей. Для никаха и больших семейных праздников.", "Up to 350 guests. For nikah and large family celebrations."] },
  { id: "c", name: ["Kichik zal", "Малый зал", "Small hall"], cap: 150, price: 4500000, pal: ["#6b3a5e", "#f2c4b0"],
    desc: ["150 kishigacha. Yaqinlar davrasida samimiy bazm.", "До 150 гостей. Тёплый праздник в кругу близких.", "Up to 150 guests. A cosy celebration with close ones."] },
];
// Multfilm qahramonlari — narx 1 soat uchun
const CHARS = [
  ["Spider-Man", 250000], ["Elsa", 250000], ["Mickey Mouse", 200000],
  [["Masha va Ayiq", "Маша и Медведь", "Masha and the Bear"], 300000],
  [["Minionlar", "Миньоны", "Minions"], 250000], ["Pikachu", 250000],
];
const EX = [
  { id: "car", ico: asset("electric-car.png"), name: ["Kelin-kuyov mashinasi", "Машина для жениха и невесты", "Wedding car"],
    d: ["Kortej uchun bezatilgan mashina", "Украшенная машина для кортежа", "Decorated car for the motorcade"],
    o: [["Chevrolet Gentra", 300000], ["Chevrolet Malibu", 500000], ["Mercedes E-class", 900000], [["Limuzin", "Лимузин", "Limousine"], 1500000]] },
  { id: "dec", ico: asset("bouquet.png"), name: ["Dekor va gullar", "Декор и цветы", "Decor & flowers"],
    d: ["Zal bezagi, gul kompozitsiyalari", "Оформление зала, цветочные композиции", "Hall decoration, flower arrangements"],
    o: [[["Standart", "Стандарт", "Standard"], 1500000], [["Premium", "Премиум", "Premium"], 2500000], [["Lux", "Люкс", "Luxury"], 4500000]] },
  { id: "foto", ico: asset("camera.png"), name: ["Foto va video", "Фото и видео", "Photo & video"],
    d: ["Butun kun suratga olish", "Съёмка весь день", "All-day shooting"],
    o: [[["Faqat foto", "Только фото", "Photo only"], 1200000], [["Foto + video", "Фото + видео", "Photo + video"], 3000000], [["Foto + video + dron", "Фото + видео + дрон", "Photo + video + drone"], 4500000]] },
  { id: "dj", ico: asset("input.png"), name: ["Tamada va DJ", "Тамада и DJ", "Host & DJ"],
    d: ["Dasturli ko’ngilochar qism", "Развлекательная программа", "Entertainment programme"],
    o: [[["Faqat DJ", "Только DJ", "DJ only"], 1000000], [["Tamada + DJ", "Тамада + DJ", "Host + DJ"], 2000000], [["Mashhur ijrochi bilan", "С известным артистом", "With a famous artist"], 6000000]] },
  { id: "surnay", ico: asset("trumpet.png"), name: ["Karnay-surnay", "Карнай-сурнай", "Karnay & surnay"],
    d: ["An’anaviy kutib olish", "Традиционная встреча гостей", "Traditional welcome"],
    o: [[["1 soat", "1 час", "1 hour"], 500000], [["Butun tadbir", "Всё мероприятие", "Whole event"], 1200000]] },
  { id: "tort", ico: asset("wedding-cake.png"), name: ["To’y torti", "Свадебный торт", "Wedding cake"],
    d: ["Buyurtma bo’yicha tayyorlanadi", "Готовится на заказ", "Made to order"],
    o: [[["3 kg", "3 кг", "3 kg"], 400000], [["6 kg", "6 кг", "6 kg"], 800000], [["10 kg, ko’p qavatli", "10 кг, многоярусный", "10 kg, multi-tier"], 1500000]] },
  { id: "multi", emo: "🎭", hr: true, name: ["Multfilm qahramonlari", "Герои мультфильмов", "Cartoon characters"],
    d: ["Kostyumdagi animator: o’yin, raqs va suratga tushish", "Аниматор в костюме: игры, танцы и фото", "Costumed performer: games, dance and photos"],
    o: CHARS },
];
const mkGal = (photos, off = 0) => Array.from({ length: Math.max(7, photos.length) }, (_, i) => ({
  url: photos[i], pal: [...HALLS[(i + off) % 3].pal].reverse(), n: i + 10 + off,
}));
const GAL = mkGal(PHOTOS.gal);

// ===== Tug’ilgan kun sahifasi ma’lumotlari (narx — 1 soat uchun) =====
const BD_HALLS = [
  { id: "ba", ph: "a", name: ["Kichik xona", "Малая комната", "Small room"], cap: 30, price: 400000, pal: ["#d6336c", "#ffd6a5"],
    desc: ["30 kishigacha. Yaqin do’stlar va oila davrasida.", "До 30 гостей. В кругу друзей и семьи.", "Up to 30 guests. Friends and family."] },
  { id: "bb", ph: "b", name: ["O’rta xona", "Средняя комната", "Medium room"], cap: 60, price: 700000, pal: ["#7048e8", "#ffd8a8"],
    desc: ["60 kishigacha. O’yin maydoni va alohida dasturxon.", "До 60 гостей. Игровая зона и отдельные столы.", "Up to 60 guests. Play area and separate tables."] },
  { id: "bc", ph: "c", name: ["Katta zal", "Большой зал", "Grand hall"], cap: 120, price: 1200000, pal: ["#1c7ed6", "#ffe066"],
    desc: ["120 kishigacha. Sahna, ovoz va yorug’lik tizimi bilan.", "До 120 гостей. Сцена, звук и свет.", "Up to 120 guests. Stage, sound and lights."] },
];
const BD_EX = [
  EX.find((e) => e.id === "multi"),
  { id: "anim", emo: "🤹", hr: true, name: ["Animator va o’yinlar", "Аниматор и игры", "Animator & games"],
    d: ["Konkurslar, disko va bolalar o’yinlari", "Конкурсы, дискотека и детские игры", "Contests, disco and kids’ games"],
    o: [[["1 ta animator", "1 аниматор", "1 animator"], 200000], [["2 ta animator", "2 аниматора", "2 animators"], 380000]] },
  { id: "balloon", emo: "🎈", name: ["Shar va bezak", "Шары и декор", "Balloons & decor"],
    d: ["Xona bezagi, shar arkasi, foto zona", "Оформление, арка из шаров, фотозона", "Room decor, balloon arch, photo zone"],
    o: [[["Standart", "Стандарт", "Standard"], 600000], [["Premium", "Премиум", "Premium"], 1200000], [["Mavzuli (multfilm)", "Тематический (мультфильм)", "Themed (cartoon)"], 1800000]] },
  { id: "cake", emo: "🎂", name: ["Tug’ilgan kun torti", "Торт на день рождения", "Birthday cake"],
    d: ["Buyurtma bo’yicha, bolaning ismi bilan", "На заказ, с именем ребёнка", "Made to order, with the child’s name"],
    o: [[["2 kg", "2 кг", "2 kg"], 250000], [["4 kg", "4 кг", "4 kg"], 500000], [["6 kg, ko’p qavatli", "6 кг, многоярусный", "6 kg, multi-tier"], 900000]] },
  { id: "show", emo: "🪄", name: ["Sehrgar va shou", "Фокусник и шоу", "Magic & show"],
    d: ["Ajoyib dastur bolalar uchun", "Яркая программа для детей", "A fun programme for kids"],
    o: [[["Sehrgar (30 daqiqa)", "Фокусник (30 минут)", "Magician (30 min)"], 500000], [["Sovun pufakchalari shousi", "Шоу мыльных пузырей", "Bubble show"], 600000]] },
  { id: "paint", emo: "🎨", hr: true, name: ["Akvagrim", "Аквагрим", "Face painting"],
    d: ["Yuzga rasm chizish", "Рисунки на лице", "Face painting for kids"],
    o: [[["1 ta rassom", "1 художник", "1 artist"], 150000]] },
  { id: "foto", emo: "📸", name: ["Foto va video", "Фото и видео", "Photo & video"],
    d: ["Bayram lavhalari", "Кадры с праздника", "Party moments"],
    o: [[["Faqat foto", "Только фото", "Photo only"], 600000], [["Foto + video", "Фото + видео", "Photo + video"], 1200000]] },
];
const MODES = {
  toy: { halls: HALLS, ex: EX, hourly: false, minGuests: 1, defGuests: 200, firstHall: "a" },
  bd: { halls: BD_HALLS, ex: BD_EX, hourly: true, minGuests: 1, defGuests: 20, firstHall: "ba", hours: [2, 3, 4, 5] },
};
const EX_HOURS = [1, 2, 3, 4];

// Xizmat variantlari rasmlari: src/images/ ichiga SHU NOMDA rasm qo’ying (gentra.jpg, malibu.png ...)
// — sayt o’zi topib, xizmat qatoriga qo’yadi. Rasm bo’lmasa, o’rniga belgi chiqadi.
const OPT_KEYS = {
  car: ["gentra", "malibu", "mercedes", "limuzin"],
  dec: ["dekor-standart", "dekor-premium", "dekor-lux"],
  foto: ["foto", "foto-video", "foto-dron"],
  dj: ["dj", "tamada-dj", "artist"],
  surnay: ["surnay-1soat", "surnay-tadbir"],
  tort: ["tort-3kg", "tort-6kg", "tort-10kg"],
  multi: ["spiderman", "elsa", "mickey", "masha", "minions", "pikachu"],
  anim: ["animator-1", "animator-2"],
  balloon: ["shar-standart", "shar-premium", "shar-mavzu"],
  cake: ["bd-tort-2kg", "bd-tort-4kg", "bd-tort-6kg"],
  show: ["sehrgar", "pufak-shou"],
  paint: ["akvagrim"],
};
const OPT_EMO = {
  dekor: "💐", foto: "📷", "foto-video": "🎥", "foto-dron": "🚁", dj: "🎧", "tamada-dj": "🎤", artist: "🌟",
  surnay: "🎺", tort: "🎂", spiderman: "🕷️", elsa: "❄️", mickey: "🐭", masha: "🐻", minions: "🍌", pikachu: "⚡",
  animator: "🤹", shar: "🎈", cake: "🎂", sehrgar: "🪄", pufak: "🫧", akvagrim: "🎨",
};
// Internetdagi tayyor rasmlar (havola orqali). Ularni o’zingizniki bilan almashtirish uchun src/images/ ichiga
// shu nomda rasm qo’ying (masalan gentra.jpg) — u havoladan ustun turadi. Havola ochilmasa, chizma chiqadi.
const REMOTE_IMG = {
  gentra: "https://podrobno.uz/upload/iblock/54b/4ebafeaf263b2698e99876183fd05b0b.jpg",
  malibu: "https://inrent.uz/uploads/cars/malibu-premier.png",
  mercedes: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Mercedes-Benz/E-Class/12151/1790577559777/front-left-side-47.jpg",
  "dekor-lux": "https://i.pinimg.com/originals/34/f2/3c/34f23c3276e811963fc00c4d084891a5.jpg",
  "dekor-standart": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiBDNSJddNHBWFhyvm2PLz2lTS4C-uPmYuCYEI1klMBleV7ipVQohpk9Kt&s=10",
  "dekor-premium": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLsRMSS1tloDiL01vKgZ0EgvFoupmTTEsVcuEn_o24zA&s=10",
  foto: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?fm=jpg&q=70&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
  "foto-video": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeEBaWvyYAXDn0br1BBldQgCWhUGs8W7Rg1CLFKeiERA_xyBYwadSlrb8&s=10",
  "foto-dron": "https://uavcoach.com/wp-content/uploads/2019/11/types-of-drones-1024x768.jpg",
  dj: "https://digitaldjpool.com/_assets/hero-dj-empty-club.jpg",
  "tamada-dj": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH3qxHDfqj4BdIghxWDWd95t_IY_HKdLHuNIiw9KxzzBnca0cTAqxgxDw&s=10",
  artist: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlbOQ-vWUtWaE6mNyK2xnHQyLg8Fdpk7VGR-MKoqwn5A&s=10",
  "surnay-1soat": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5TMbDz2mH4QvKqtcVSJOR5BpvDjD73uMAs_zsUnO5sJ0pQgEeeSme96c&s=10",
  "surnay-tadbir": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5TMbDz2mH4QvKqtcVSJOR5BpvDjD73uMAs_zsUnO5sJ0pQgEeeSme96c&s=10",
  "tort-3kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuR_XqYDyGdhKq1A-66zcC97SNf78Qc5C_Y20m5I_AsTi675Hxm_QSNUV7&s=10",
  "tort-6kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2ND6rtibntwhmW1Q-PZ03is0HKgdlqSPu0TUITgh7NmWRI5kfkqXAcXYK&s=10",
  "tort-10kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXFmR9zwfRrB4RqSoNVyQv91e9LkBpIjWNPG24_T58NtQ2bq1zp4n2mNvl&s=10",
  spiderman: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXKtJNVWrlbdTVVCC34y8TdbX3r7sdv6C1TWhQQLF_0Tw5KR49mc51SbM&s=10",
  elsa: "https://i.pinimg.com/474x/dd/c9/c8/ddc9c8696b25e395c5732ca76e032bc6.jpg",
  mickey: "https://i1.sndcdn.com/artworks-cUlL3qD08aXzeUxn-5msy1g-t500x500.jpg",
  masha: "https://images.meme-arsenal.com/8f02c3ca84810c5af05cb8d4659c6c48.jpg",
  minions: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOxissY5ev6ULiojKBESL9_ivSKqJOog5JC6AZtgrdlQoX8VC26JO8ptA&s=10",
  pikachu: "https://i.pinimg.com/736x/99/be/9b/99be9bc069f93dfec20d19f3ecb31913.jpg",
  "animator-1": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpn6GkEbl_X92CSaMaqXtV5Cbl0jWUdW3c9100hFsPmnSVJTGLUwck6zM&s=10",
  "animator-2": "https://esra.edu/wp-content/uploads/2025/09/animateur3D.jpg",
  "shar-standart": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnMPfBc3mxg7Vd6ykY0w4JUsghZT_FLQIOuHAz_e3MzJylNnjyyDLCuaA&s=10",
  "shar-premium": "https://cheetah.cherishx.com/uploads/1719919395_large.jpg",
  "shar-mavzu": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKD4rCGf29-4XswwX2ZWTMI0urFTP6tXdKroo_OtycqRMxKR6qmUKZhc72&s=10",
  "bd-tort-2kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIw1CbcKPRcx_aiGwEsrG4SyeebuZoZlbR34bmdDEAaPsBapmrgD2eI_Lu&s=10",
  "bd-tort-4kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP3nUtHrJgq0x_AyBe0pWHzMVhLRv3CVjdfP27U5-PT4t6iJ4tdOpfmhcJ&s=10",
  "bd-tort-6kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFRwOKroTcO5LxGEPwOWjylf1zTWuCCiq0mf2WJ17__Wy9LKI0nbfYkVHS&s=10",
  sehrgar: "https://www.1923lv.com/wp-content/uploads/2024/01/Magician-in-Las-Vegas-1923-Prohibition-Bar.jpeg",
  "pufak-shou": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/0a/36/df/the-gazillion-bubble.jpg?w=900&h=500&s=1",
  akvagrim: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1YgLVb0TMbbe1wqmebamwMIvoVSlRtKD8vvZrl7xU08xyjiVtnhjgpOz5&s=10",
  limuzin: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmi6OtsfrKkbr2x2pgwNxF7zeqrjxUMVabDf68cu7OPIrOvS3oVOFUp1g&s=10",
};
const CAR_LOOK = { gentra: ["#2f6fdb", 0], malibu: ["#8d99a6", 0], mercedes: ["#1c1f26", 0], limuzin: ["#15171c", 1] };

// Rasm bo’lmagan variantlar uchun o’zimiz chizgan tasvirlar (original, har biri o’z belgisi bilan)
const Flower = ({ x, y, r, c }) => (
  <g>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + r * Math.cos((a * Math.PI) / 180)} cy={y + r * Math.sin((a * Math.PI) / 180)} r={r * 0.75} fill={c} />)}<circle cx={x} cy={y} r={r * 0.6} fill="#ffd54a" /></g>
);
const Tiers = ({ n, candles, c1, c2 }) => (
  <g>
    <ellipse cx="23" cy="33" rx="17" ry="2.5" fill="#d9c7a8" />
    {Array.from({ length: n }, (_, i) => {
      const w = n === 1 ? 26 : 30 - i * (n === 2 ? 10 : 7), h = n === 1 ? 13 : 9, y = 31 - h * (i + 1) + (i ? i * 0 : 0);
      return <g key={i}><rect x={23 - w / 2} y={y + 0.5 * i} width={w} height={h} rx="2" fill={i % 2 ? c2 : c1} /><path d={`M${23 - w / 2} ${y + 3 + 0.5 * i}q${w / 8} 3 ${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0`} fill="none" stroke="#fff" strokeWidth="1.4" opacity=".8" /></g>;
    })}
    {candles ? [-4, 0, 4].map((d) => <g key={d}><rect x={23 + d - 0.7} y={31 - (n === 1 ? 13 : 9 * n - 0.5 * n) - 6} width="1.4" height="5" fill="#fff" /><ellipse cx={23 + d} cy={31 - (n === 1 ? 13 : 9 * n - 0.5 * n) - 7.5} rx="1.1" ry="1.8" fill="#ffb300" /></g>) : <circle cx="23" cy={31 - (n === 1 ? 13 : 9 * n) - 3} r="2.4" fill="#e53935" />}
  </g>
);
const Balloon = ({ x, y, c }) => (<g><ellipse cx={x} cy={y} rx="5.5" ry="6.8" fill={c} /><path d={`M${x} ${y + 6.8}l-1.5 2h3z`} fill={c} /><path d={`M${x} ${y + 8.8}q-2 4 1 7`} fill="none" stroke="#7b6e61" strokeWidth=".8" /><ellipse cx={x - 2} cy={y - 2.6} rx="1.4" ry="2.2" fill="#fff" opacity=".45" /></g>);
const Kid = ({ x, c, hat }) => (<g><path d={`M${x - 5} 33v-9a5 5 0 0 1 10 0v9z`} fill={c} /><circle cx={x} cy="14" r="5" fill="#ffd9b0" />{hat && <path d={`M${x - 4} 10l4-9 4 9z`} fill="#f06595" />}<circle cx={x - 1.8} cy="14" r=".7" fill="#333" /><circle cx={x + 1.8} cy="14" r=".7" fill="#333" /><path d={`M${x - 2} 16.4q2 1.6 4 0`} fill="none" stroke="#333" strokeWidth=".7" /></g>);
const Cam = ({ x = 0, s = 1 }) => (<g transform={`translate(${x} 0) scale(${s})`}><rect x="8" y="12" width="30" height="19" rx="3.5" fill="#2e3440" /><rect x="14" y="8.5" width="9" height="4.5" rx="1.5" fill="#2e3440" /><circle cx="23" cy="21.5" r="7" fill="#5c6b80" /><circle cx="23" cy="21.5" r="4.4" fill="#1b2330" /><circle cx="21.4" cy="19.8" r="1.3" fill="#fff" opacity=".7" /><circle cx="33" cy="15.5" r="1.3" fill="#ffd54a" /></g>);
const ILLU = {
  "dekor-standart": () => <g><path d="M17 33l2-12h8l2 12z" fill="#7aa5a0" /><path d="M23 21V12" stroke="#4e8a3a" strokeWidth="1.5" /><Flower x={23} y={9} r={3.4} c="#f48fb1" /><Flower x={17} y={14} r={2.8} c="#fff" /><Flower x={29} y={14} r={2.8} c="#ffcc80" /></g>,
  "dekor-premium": () => <g><path d="M15 33l2.5-13h11l2.5 13z" fill="#6c8ebf" /><Flower x={23} y={9} r={3.6} c="#f06292" /><Flower x={14} y={13} r={3} c="#fff" /><Flower x={32} y={13} r={3} c="#ffcc80" /><Flower x={18} y={18} r={2.6} c="#ba68c8" /><Flower x={28} y={18} r={2.6} c="#f48fb1" /></g>,
  "dekor-lux": () => <g><path d="M6 31Q6 5 23 5T40 31" fill="none" stroke="#4e8a3a" strokeWidth="2.2" />{[[8, 24], [10, 14], [16, 8], [23, 5], [30, 8], [36, 14], [38, 24]].map(([x, y], i) => <Flower key={i} x={x} y={y} r={3} c={["#f06292", "#fff", "#ffcc80", "#ba68c8"][i % 4]} />)}<path d="M11 33h24" stroke="#d9c7a8" strokeWidth="2" /></g>,
  foto: () => <Cam />,
  "foto-video": () => <g><Cam x={-6} s={0.85} /><rect x="27" y="13" width="14" height="10" rx="2" fill="#e53935" /><path d="M41 16l5-3v10l-5-3z" fill="#e53935" /></g>,
  "foto-dron": () => <g><ellipse cx="23" cy="20" rx="8" ry="4" fill="#2e3440" /><circle cx="23" cy="24" r="2.4" fill="#5c6b80" />{[[7, 12], [39, 12], [7, 26], [39, 26]].map(([x, y], i) => <g key={i}><path d={`M23 20L${x} ${y}`} stroke="#2e3440" strokeWidth="1.4" /><ellipse cx={x} cy={y} rx="5" ry="1.4" fill="#90a4ae" /></g>)}</g>,
  dj: () => <g><path d="M9 24V19a14 14 0 0 1 28 0v5" fill="none" stroke="#2e3440" strokeWidth="3" /><rect x="5" y="20" width="8" height="13" rx="3.5" fill="#e53935" /><rect x="33" y="20" width="8" height="13" rx="3.5" fill="#e53935" /></g>,
  "tamada-dj": () => <g><path d="M5 25V21a11 11 0 0 1 22 0v4" fill="none" stroke="#2e3440" strokeWidth="2.5" /><rect x="2" y="22" width="6" height="10" rx="3" fill="#e53935" /><rect x="24" y="22" width="6" height="10" rx="3" fill="#e53935" /><rect x="34" y="5" width="7" height="12" rx="3.5" fill="#455a64" /><path d="M37.5 17v10M33 28h9" stroke="#455a64" strokeWidth="1.6" /></g>,
  artist: () => <g><path d="M23 4l4.2 9 9.8 1-7.4 6.6 2.2 9.7L23 25l-8.8 5.3 2.2-9.7L9 14l9.8-1z" fill="#ffc107" /><circle cx="23" cy="17" r="3" fill="#fff" opacity=".6" /></g>,
  "surnay-1soat": () => <g><rect x="2" y="20.5" width="27" height="3" rx="1.5" fill="#b8860b" /><rect x="9" y="19" width="2.4" height="6" rx="1" fill="#8d6508" /><path d="M28 20.5L40 8v28L28 23.5z" fill="#d4a017" /><ellipse cx="40" cy="22" rx="3" ry="14" fill="#f1c453" /><ellipse cx="40" cy="22" rx="1.6" ry="9" fill="#8d6508" /></g>,
  "surnay-tadbir": () => <g><rect x="2" y="22" width="25" height="3" rx="1.5" fill="#b8860b" /><path d="M26 22L36 12v28L26 25z" fill="#d4a017" /><ellipse cx="36" cy="26" rx="2.6" ry="14" fill="#f1c453" /><ellipse cx="36" cy="26" rx="1.4" ry="9" fill="#8d6508" /><path d="M10 12v-6l5-1v6" fill="none" stroke="#e53935" strokeWidth="1.5" /><circle cx="9" cy="12.3" r="1.8" fill="#e53935" /><circle cx="14" cy="11.3" r="1.8" fill="#e53935" /><path d="M43 12q3 2 0 5M43 20q4 2 0 6" fill="none" stroke="#e53935" strokeWidth="1.2" strokeLinecap="round" /></g>,
  "tort-3kg": () => <Tiers n={1} c1="#f8bbd0" c2="#fff" />,
  "tort-6kg": () => <Tiers n={2} c1="#fff" c2="#f8bbd0" />,
  "tort-10kg": () => <Tiers n={3} c1="#fff" c2="#f8bbd0" />,
  "bd-tort-2kg": () => <Tiers n={1} candles c1="#ffcc80" c2="#fff" />,
  "bd-tort-4kg": () => <Tiers n={2} candles c1="#f48fb1" c2="#fff" />,
  "bd-tort-6kg": () => <Tiers n={3} candles c1="#f48fb1" c2="#ce93d8" />,
  "animator-1": () => <Kid x={23} c="#42a5f5" hat />,
  "animator-2": () => <g><Kid x={14} c="#42a5f5" hat /><Kid x={32} c="#ab47bc" hat /></g>,
  "shar-standart": () => <g><Balloon x={16} y={14} c="#ef5350" /><Balloon x={29} y={12} c="#42a5f5" /></g>,
  "shar-premium": () => <g><path d="M5 33Q5 6 23 6T41 33" fill="none" stroke="#7b6e61" strokeWidth=".8" />{[[6, 28, "#ef5350"], [8, 18, "#ffd54a"], [14, 10, "#42a5f5"], [23, 7, "#ab47bc"], [32, 10, "#66bb6a"], [38, 18, "#ef5350"], [40, 28, "#ffd54a"]].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="4.2" fill={c} />)}</g>,
  "shar-mavzu": () => <g><Balloon x={14} y={13} c="#ef5350" /><path d="M31 3l2.6 5.6 6 .7-4.5 4 1.3 6L31 16.4 25.6 19.3l1.3-6-4.5-4 6-.7z" fill="#ffc107" /><path d="M31 19.3q-2 6 1 11" fill="none" stroke="#7b6e61" strokeWidth=".8" /></g>,
  sehrgar: () => <g><path d="M12 31l3-16h16l3 16z" fill="#2e3440" /><rect x="10" y="29" width="26" height="4" rx="1.5" fill="#2e3440" /><rect x="14" y="24" width="18" height="2.5" fill="#e53935" /><path d="M36 12l8-8" stroke="#7b6e61" strokeWidth="2" strokeLinecap="round" /><path d="M42 3l.9 2 2.1.2-1.6 1.4.5 2.1-1.9-1.1-1.9 1.1.5-2.1L39 5.2l2.1-.2z" fill="#ffc107" /></g>,
  "pufak-shou": () => <g>{[[14, 22, 8], [30, 14, 6], [26, 27, 4.5], [38, 25, 3.5], [10, 8, 3.5]].map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r} fill="#b3e5fc" fillOpacity=".55" stroke="#4fc3f7" strokeWidth="1" /><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.22} fill="#fff" /></g>)}</g>,
  akvagrim: () => <g><path d="M23 6c-10 0-18 6-18 14 0 6 4 8 8 8 3 0 3 3 3 5 0 2 2 3 5 3 10 0 17-6 17-15S32 6 23 6z" fill="#e8d5b5" /><circle cx="15" cy="16" r="2.6" fill="#ef5350" /><circle cx="22" cy="12" r="2.6" fill="#ffd54a" /><circle cx="30" cy="14" r="2.6" fill="#42a5f5" /><circle cx="33" cy="22" r="2.6" fill="#66bb6a" /></g>,
};

function CarSvg({ color, long }) {
  const w = long ? 108 : 64;
  return (
    <svg viewBox={`0 0 ${w} 40`} aria-hidden="true">
      <rect x="3" y="20" width={w - 6} height="11" rx="4.5" fill={color} />
      <path d={`M15 21 L23 11 H${w - 25} L${w - 14} 21 Z`} fill={color} />
      <path d={`M19 20 L25 12.5 H${w / 2 - 1} V20 Z`} fill="#d7ecff" />
      <path d={`M${w / 2 + 2} 20 V12.5 H${w - 26} L${w - 19} 20 Z`} fill="#d7ecff" />
      <circle cx="16" cy="31" r="5.5" fill="#1b1b1b" /><circle cx="16" cy="31" r="2.2" fill="#b9b9b9" />
      <circle cx={w - 16} cy="31" r="5.5" fill="#1b1b1b" /><circle cx={w - 16} cy="31" r="2.2" fill="#b9b9b9" />
      <rect x={w - 7} y="22" width="3" height="3" rx="1" fill="#ffe08a" />
    </svg>
  );
}

// Xizmat varianti rasmi: rasm bor bo’lsa — rasm, bo’lmasa — mashina chizmasi yoki belgi
function OptThumb({ e, i, label }) {
  const [bad, setBad] = useState(false);
  const [zoom, setZoom] = useState(false);
  const k = (OPT_KEYS[e.id] || [])[i];
  useEffect(() => {
    if (!zoom) return;
    const f = (ev) => ev.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [zoom]);
  if (!k) return null;
  const url = assetBase(k) || (!bad && REMOTE_IMG[k]) || "";
  const car = CAR_LOOK[k];
  const emo = OPT_EMO[k] || OPT_EMO[k.split("-")[0]] || e.emo || "✨";
  const open = (ev) => { ev.stopPropagation(); setZoom(true); };
  return (
    <span className={"oth" + (url ? " photo" : "")} aria-hidden={url ? undefined : "true"}
      role={url ? "button" : undefined} tabIndex={url ? 0 : undefined} onClick={url ? open : undefined}
      onKeyDown={url ? (ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), open(ev)) : undefined}>
      {url ? <img src={url} alt={label || ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} /> : ILLU[k] ? <svg viewBox="0 0 46 36">{ILLU[k]()}</svg> : car ? <CarSvg color={car[0]} long={car[1]} /> : <span className="oe">{emo}</span>}
      {url && <span className="pv"><Pic url={url} fit /></span>}
      {zoom && createPortal(
        <div className="zoom" onClick={(ev) => { ev.stopPropagation(); setZoom(false); }} role="dialog" aria-modal="true">
          <figure onClick={(ev) => ev.stopPropagation()}>
            <img src={url} alt={label || ""} referrerPolicy="no-referrer" />
            {label && <figcaption>{label}</figcaption>}
          </figure>
          <button type="button" className="zx" onClick={() => setZoom(false)} aria-label="×">×</button>
        </div>, document.body)}
    </span>
  );
}

const pick = (x, li) => (Array.isArray(x) ? x[li] : x);
const fmt = (n, cur) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + cur;
const key = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dot = (k) => k.split("-").reverse().join(".");

function artSvg(p, n) {
  let s = `<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="400" height="260" fill="url(#g${n})"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${i * 80} 260V150a40 55 0 0 1 80 0V260z" fill="rgba(255,255,255,${0.08 + ((n + i) % 3) * 0.05})"/>`;
  s += `<path d="M200 0V60" stroke="rgba(255,255,255,.7)"/>`;
  for (let j = 0; j < 7; j++) s += `<circle cx="${150 + j * 17}" cy="${66 + Math.abs(3 - j) * 7}" r="3.5" fill="#fff" opacity=".9"/>`;
  s += `<ellipse cx="200" cy="64" rx="64" ry="16" fill="none" stroke="rgba(255,255,255,.6)"/>`;
  for (let k = 0; k < 4; k++) s += `<ellipse cx="${60 + k * 93}" cy="${215 + ((n + k) % 2) * 12}" rx="30" ry="9" fill="rgba(255,255,255,.35)"/>`;
  return s + "</svg>";
}

// Rasm bo’lsa — rasm, bo’lmasa — namunaviy tasvir
// fit=true: rasm KESILMAYDI — to’liq ko’rinadi, bo’sh joy esa shu rasmning xiralashgan nusxasi bilan to’ldiriladi
function Pic({ url, pal, n, fit }) {
  const [bad, setBad] = useState(false);
  const u = bad ? "" : url;
  if (u && fit) return (<><img className="bgi" src={u} alt="" aria-hidden="true" loading="lazy" decoding="async" referrerPolicy="no-referrer" /><img className="fg" src={u} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} /></>);
  if (u) return <img src={u} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: artSvg(pal || ["#7a2a18", "#d9a35a"], n || 1) }} />;
}

function BdMark() {
  // happy-birthday.png topilmasa — o’rniga shar chizmasi
  return (
    <svg className="lg lg-bd" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-7 18 32;7 18 32;-7 18 32" keyTimes="0;.5;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" />
        <ellipse cx="18" cy="14" rx="9" ry="10.5" fill="#f06595" /><path d="M18 24.5l-2.5 3h5z" fill="#f06595" />
        <path d="M18 27.5c-2 3-1 5 1 7" fill="none" stroke="#323e4e" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="14.5" cy="10" rx="2.2" ry="3.4" fill="#fff" opacity=".45" transform="rotate(25 14.5 10)" />
      </g>
    </svg>
  );
}

function Logo({ li, bd }) {
  const [bad, setBad] = useState(false);
  let mark;
  if (bd) {
    mark = !bad && PHOTOS.logoBd
      ? <img className="lg lg-bd" src={PHOTOS.logoBd} alt="" onError={() => setBad(true)} />
      : <BdMark />;
  } else if (PHOTOS.logo) {
    mark = <img className="lg" src={PHOTOS.logo} alt="" />;
  } else {
    mark = (
      <svg className="lg lg-rings" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <circle className="r1" cx="11" cy="17" r="8" />
        <circle className="r2" cx="19" cy="17" r="8" />
      </svg>
    );
  }
  return (
    <span className="logo serif">
      <span className="mk">{mark}<i /><i /><i /><i /></span>
      <span className="nm">{CFG.name[li]}</span>
    </span>
  );
}

const CAL_AHEAD = 18; // necha oy oldinga bron qilish mumkin
function Calendar({ t, hall, date, onPick, isBooked }) {
  const now = new Date();
  const cur = now.getFullYear() * 12 + now.getMonth();
  const [idx, setIdx] = useState(cur);
  const [dir, setDir] = useState(0);
  const y = Math.floor(idx / 12), m = idx % 12;
  const first = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
  const shift = (v) => { const n = idx + v; if (n < cur || n > cur + CAL_AHEAD) return; setDir(v); setIdx(n); };
  return (
    <div className="cal">
      <div className="ch">
        <button type="button" onClick={() => shift(-1)} disabled={idx <= cur} aria-label={t.prev}>‹</button>
        <span>{t.months[m]} {y}</span>
        <button type="button" onClick={() => shift(1)} disabled={idx >= cur + CAL_AHEAD} aria-label={t.next}>›</button>
      </div>
      <div className={"g mv" + (dir > 0 ? " nx" : dir < 0 ? " pv" : "")} key={y + "-" + m}>
        {t.dw.map((d) => <div key={d} className="dw">{d}</div>)}
        {Array.from({ length: first }, (_, i) => <div key={"e" + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1, k = key(y, m, d);
          const b = isBooked(hall, k), past = new Date(y, m, d) < today;
          return (
            <button key={k} type="button" disabled={b || past} title={b ? t.calBusy : undefined}
              aria-label={`${d} ${t.months[m]}${b ? " — " + t.calBusy : ""}`}
              className={"d" + (b ? " b" : "") + (date === k ? " s" : "") + (k === todayKey ? " t" : "")} onClick={() => onPick(k)}>
              {d}{b && <i aria-hidden="true">🔒</i>}
            </button>
          );
        })}
      </div>
      <div className="leg"><span><i className="lf" />{t.calFree}</span><span><i className="lb2" />{t.calBusy}</span><span><i className="ls" />{t.calSel}</span></div>
    </div>
  );
}

function Ico({ e, big }) {
  const cls = "ic" + (big ? " big" : "");
  if (e.emo) return <span className={cls + " emo"} aria-hidden="true">{e.emo}</span>;
  return <img className={cls} src={e.ico} alt="" />;
}

function BookingModal({ lang, mode, initialHall, booked, onBooked, onSynced, onClose }) {
  const M = MODES[mode], bd = mode === "bd";
  const t0 = T[lang], t = bd ? { ...t0, ...t0.bd } : t0;
  const li = LANGS.indexOf(lang), P = (x) => pick(x, li), F = (n) => fmt(n, t.cur);
  const [hallId, setHallId] = useState(initialHall);
  const [date, setDate] = useState(null);
  const [hours, setHours] = useState(bd ? M.hours[0] : 0);
  const [guests, setGuests] = useState(M.defGuests);
  const [gEdit, setGEdit] = useState(null); // yozayotganda maydon bo’sh bo’la olishi uchun
  const [ex, setEx] = useState({});
  const [exH, setExH] = useState({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  // Telegram shaxsiy chatga matnni o’zi qo’ymasligi mumkin — shuning uchun nusxalab ham beramiz
  const sendTg = () => {
    try { navigator.clipboard.writeText(done.txt); setCopied(true); } catch { /* ignore */ }
  };

  const hall = M.halls.find((h) => h.id === hallId);
  // Band sanalar: haqiqiy bronlar (server yoki, server bo’lmasa, shu brauzerdagi bronlar)
  const isBooked = (h, k) => booked.some((b) => b.hall === h && b.date === k);
  const hoursOf = (e) => (e.hr ? exH[e.id] || 1 : 1);

  const rows = useMemo(() => {
    const r = [bd
      ? [`${P(hall.name)} · ${F(hall.price)} × ${t.hrWord(hours)}`, hall.price * hours]
      : [`${t.hallRow}: ${P(hall.name)}`, hall.price]];
    M.ex.forEach((e) => {
      const i = ex[e.id];
      if (i !== undefined) r.push([`${P(e.name)}: ${P(e.o[i][0])}${e.hr ? ` × ${t.hrWord(hoursOf(e))}` : ""}`, e.o[i][1] * hoursOf(e)]);
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hall, ex, exH, hours, lang]);
  const total = rows.reduce((a, r) => a + r[1], 0);

  const pickHall = (id) => { setHallId(id); if (date && isBooked(id, date)) setDate(null); };
  const setExtra = (id, i) => setEx((p) => { const n = { ...p }; if (i < 0) delete n[id]; else n[id] = i; return n; });

  const submit = () => {
    let e = "";
    if (!date) e = t.eDate;
    else if (name.trim().length < 2) e = t.eName;
    else if (phone.replace(/[^\d]/g, "").length < 9) e = t.ePhone;
    else if (guests > hall.cap) e = t.eCap(hall.cap);
    setErr(e);
    if (e) return;
    // Egasiga xabar har doim o’zbekcha ketadi
    const exTxt = M.ex.filter((x) => ex[x.id] !== undefined)
      .map((x) => `${pick(x.name, 0)} (${pick(x.o[ex[x.id]][0], 0)}${x.hr ? `, ${hoursOf(x)} soat` : ""})`).join(", ") || "yo’q";
    const when = bd ? `${dot(date)}, ${hours} soat` : dot(date);
    const txt = `${bd ? "Yangi tug’ilgan kun broni" : "Yangi bron"}: ${hall.name[0]}, ${when}, ${guests} kishi. Qo’shimcha: ${exTxt}. Jami: ${fmt(total, T.uz.cur)}. ${name.trim()}, ${phone}`;
    const summary = `${P(hall.name)} · ${dot(date)}${bd ? ` · ${t.hrWord(hours)}` : ""} · ${F(total)}`;
    setBusy(true);
    // Backend (api/bookings.js) bo’lsa — sana saqlanadi va egasiga Telegramdan xabar boradi.
    // Backend bo’lmasa (masalan npm run dev) — eski usul: brauzerda saqlanadi, Telegram tugmasi chiqadi.
    fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hall: hallId, date, name: name.trim(), phone, guests, total, text: txt }) })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (r.status === 409) { setErr(t.eTaken); setDate(null); setBusy(false); onSynced && onSynced(); return; }
        if (j && j.stored) onSynced && onSynced(); else onBooked({ hall: hallId, date });
        setBusy(false);
        setDone({ sum: summary, txt, sent: !!(j && j.ok && j.sent) });
      })
      .catch(() => {
        onBooked({ hall: hallId, date });
        setBusy(false);
        setDone({ sum: summary, txt });
        fetch("/api/bron", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: txt }) })
          .then((r) => r.ok && setDone((d) => d && { ...d, sent: true })).catch(() => {});
      });
  };

  return (
    <div className="ov on" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        {done ? (
          <div className="done">
            <h3>{t.doneT}</h3>
            <p>{t.soon}<br /><b>{done.sum}</b></p>
            {done.sent && <p style={{ color: "var(--ok)", fontWeight: 600 }}>✓ {t.sentOk}</p>}
            <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://t.me/${CFG.tg}?text=${encodeURIComponent(done.txt)}`} onClick={sendTg}>{t.viaTg}</a>
            {copied && <p style={{ fontSize: 13, color: "var(--muted)" }}>{t.copied}</p>}
            <p><button className="btn ghost sm" onClick={onClose}>{t.close}</button></p>
          </div>
        ) : (
          <>
            <div className="sh"><h3 style={{ fontSize: 22 }}>{t.modalT}</h3><button className="x" onClick={onClose} aria-label={t.close}>×</button></div>

            <div className="st" style={{ marginTop: 4 }}>{t.hall}</div>
            <div className="chips">
              {M.halls.map((h) => <button key={h.id} type="button" className={"chip" + (h.id === hallId ? " sel" : "")} onClick={() => pickHall(h.id)}>{P(h.name)}</button>)}
            </div>

            <div className="st">{t.date}</div>
            <Calendar t={t} hall={hallId} date={date} onPick={setDate} isBooked={isBooked} />
            <div className="dl">{date ? `${t.picked}: ${dot(date)}` : t.pick}</div>

            {bd && (
              <>
                <div className="st">{t.dur}</div>
                <div className="chips">
                  {M.hours.map((h) => <button key={h} type="button" className={"chip" + (hours === h ? " sel" : "")} onClick={() => setHours(h)}>{t.hrWord(h)}</button>)}
                </div>
              </>
            )}

            <div className="st">{t.gm}</div>
            <label className="t">{t.guests(hall.cap)}
              <input className="i" type="number" inputMode="numeric" min={M.minGuests} max={hall.cap} value={gEdit !== null ? gEdit : guests}
                onChange={(e) => { const raw = e.target.value; setGEdit(raw); const n = parseInt(raw, 10); if (n >= M.minGuests) setGuests(n); }}
                onBlur={() => setGEdit(null)} />
            </label>

            <div className="st">{t.extras}</div>
            {M.ex.map((e) => (
              <div key={e.id} className="xg">
                <b><Ico e={e} /> {P(e.name)}</b>
                <div className="chips">
                  <button type="button" className={"chip" + (ex[e.id] === undefined ? " sel" : "")} onClick={() => setExtra(e.id, -1)}>{t.none}</button>
                  {e.o.map((o, i) => (
                    <button key={i} type="button" className={"chip" + (ex[e.id] === i ? " sel" : "")} onClick={() => setExtra(e.id, i)}>{P(o[0])} · {F(o[1])}{e.hr ? `/${t.hr}` : ""}</button>
                  ))}
                </div>
                {e.hr && ex[e.id] !== undefined && (
                  <div className="chips hrs" aria-label={t.dur}>
                    {EX_HOURS.map((h) => (
                      <button key={h} type="button" className={"chip" + (hoursOf(e) === h ? " sel" : "")} onClick={() => setExH((p) => ({ ...p, [e.id]: h }))}>{t.hrWord(h)}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="st">{t.contact}</div>
            <div className="f">
              <label className="t">{t.name}<input className="i" autoComplete="name" placeholder="Aziz" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="t">{t.phone}<input className="i" type="tel" autoComplete="tel" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            </div>

            <div className="tot">
              {rows.map((r, i) => <div key={i}><span>{r[0]}</span><span>{F(r[1])}</span></div>)}
              <div className="big"><span>{t.total}</span><span>{F(total)}</span></div>
            </div>
            <div className="err">{err}</div>
            <button className="btn" style={{ width: "100%" }} onClick={submit} disabled={busy}>{busy ? t.sending : t.send}</button>
          </>
        )}
      </div>
    </div>
  );
}

// Rasmni katta ko’rsatish (lightbox)
function Lightbox({ t, gal, i, setI, onClose }) {
  const n = gal.length;
  const dir = useRef(1);   // oxirgi o’tish yo’nalishi (animatsiya uchun)
  const t0 = useRef(null); // barmoq bosilgan nuqta (surish uchun)
  const go = (v) => { dir.current = v; setI((x) => (x + v + n) % n); };
  // Telefon/planshet: chapga-o’ngga surib rasm almashtirish, pastga tortib yopish
  const ts = (e) => { const p = e.touches[0]; t0.current = p && e.touches.length === 1 ? { x: p.clientX, y: p.clientY } : null; };
  const te = (e) => {
    const s = t0.current; t0.current = null;
    const p = e.changedTouches[0];
    if (!s || !p) return;
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx) * 1.3) onClose();
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const g = gal[i];
  return (
    <div className="lb" onClick={onClose} onTouchStart={ts} onTouchEnd={te} role="dialog" aria-modal="true">
      <div className="lbimg" key={i} data-dir={dir.current > 0 ? "n" : "p"} onClick={(e) => e.stopPropagation()}><Pic url={g.url} pal={g.pal} n={g.n} /></div>
      <button className="lbb lbc" onClick={onClose} aria-label={t.close}>×</button>
      <button className="lbb lbp" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={t.prev}>‹</button>
      <button className="lbb lbn" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={t.next}>›</button>
      <div className="lbt">{i + 1} / {n}</div>
    </div>
  );
}

function AdminChat({ t, lang }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const endRef = useRef(null);
  const a = CFG.admin;
  const tg = `https://t.me/${a.tg}?text=${encodeURIComponent(t.adminMsg)}`;
  const wa = `https://wa.me/${a.phone.replace("+", "")}?text=${encodeURIComponent(t.adminMsg)}`;
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);

  const send = (e) => {
    e.preventDefault();
    const q = txt.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setTxt(""); setBusy(true); setFail(false);
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (!j || !j.reply) throw new Error(); setMsgs((m) => [...m, { role: "assistant", content: j.reply }]); })
      .catch(() => setFail(true))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm">
      {open && (
        <div className="admp chat" role="dialog" aria-label={t.aiTitle}>
          <div className="chh"><b>{t.aiTitle}</b><button type="button" className="x" onClick={() => setOpen(false)} aria-label={t.close}>×</button></div>
          <div className="chm">
            <div className="msg bot">{t.aiHello}</div>
            {msgs.map((m, i) => <div key={i} className={"msg " + (m.role === "user" ? "me" : "bot")}>{m.content}</div>)}
            {busy && <div className="msg bot dots"><i /><i /><i /></div>}
            {fail && <div className="msg bot err">{t.aiErr}</div>}
            <div ref={endRef} />
          </div>
          <form className="chf" onSubmit={send}>
            <input className="i" value={txt} maxLength={500} onChange={(e) => setTxt(e.target.value)} placeholder={t.aiPh} aria-label={t.aiPh} />
            <button className="btn sm" type="submit" disabled={busy || !txt.trim()}>➤</button>
          </form>
          <div className="cha"><span>{t.adminSub}</span>
            <div>
              <a className="btn sm ghost" href={tg} target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
              <a className="btn sm ghost" href={wa} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
              <a className="btn sm ghost" href={`tel:${a.phone}`}>📞</a>
            </div>
          </div>
        </div>
      )}
      <button type="button" className="admb" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span aria-hidden="true">{open ? "×" : "🤖"}</span> {t.aiBtn}
      </button>
    </div>
  );
}

const NAV_IDS = ["bosh", "zallar", "xizmat", "galereya", "aloqa"];

// Menyu: "suyuq" kapsula hover qilingan (yoki hozir ko’rilayotgan) bo’limga oqib o’tadi, havolalar kursorga tortiladi
function NavDock({ labels, dep }) {
  const box = useRef(null);
  const [act, setAct] = useState(-1);
  const [hov, setHov] = useState(-1);
  const [tick, setTick] = useState(0);
  const [pos, setPos] = useState({ x: 0, w: 0, on: false });
  const tgt = hov >= 0 ? hov : act;

  useEffect(() => {
    let raf = 0;
    const f = () => {
      raf = 0;
      let a = -1;
      NAV_IDS.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 150) a = i; });
      setAct(a);
      const de = document.documentElement, max = de.scrollHeight - de.clientHeight;
      // "--p" faqat menyuning o’zida o’zgaradi (butun sahifada emas) — skroll yengil bo’lishi uchun
      const nv = document.querySelector("nav");
      if (nv) { nv.style.setProperty("--p", max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4) : "0"); nv.toggleAttribute("data-s", window.scrollY > 8); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(f); };
    const rs = () => setTick((n) => n + 1);
    f();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", rs);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rs).catch(() => {});
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", rs); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useLayoutEffect(() => {
    const el = box.current && tgt >= 0 ? box.current.children[tgt] : null;
    setPos(el ? { x: el.offsetLeft, w: el.offsetWidth, on: true } : (p) => ({ ...p, on: false }));
    // telefonda menyu yonga surilsa, faol bo’lim ko’rinib turadi
    const b = box.current;
    if (el && b && b.scrollWidth > b.clientWidth + 2) b.scrollTo({ left: Math.max(0, el.offsetLeft - (b.clientWidth - el.offsetWidth) / 2), behavior: "smooth" });
  }, [tgt, dep, tick]);

  // havolani bosganda bo’lim sarlavhasi "jonlanadi"
  const flash = (id) => {
    const sec = document.getElementById(id);
    const h = sec && sec.querySelector("h2");
    if (!h) return;
    h.removeAttribute("data-flash");
    setTimeout(() => { h.setAttribute("data-flash", ""); setTimeout(() => h.removeAttribute("data-flash"), 1100); }, 450);
  };

  const pull = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 7;
    const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 5;
    e.currentTarget.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const release = (e) => { e.currentTarget.style.transform = ""; };

  return (
    <span className="dock" ref={box} onMouseLeave={() => setHov(-1)}>
      {NAV_IDS.map((id, i) => (
        <a key={id} className={"l" + (i === act ? " act" : "")} href={"#" + id} onClick={() => flash(id)} onTouchEnd={() => setTimeout(() => setHov(-1), 350)}
          onMouseEnter={() => setHov(i)} onMouseMove={pull} onMouseLeave={release} onFocus={() => setHov(i)} onBlur={() => setHov(-1)}>
          {labels[i]}
        </a>
      ))}
      <span className="blob" aria-hidden="true" style={{ transform: `translateX(${pos.x}px)`, width: pos.w, opacity: pos.on ? 1 : 0 }}>
        <i key={tgt} />
      </span>
    </span>
  );
}

const ripOnly = (ms) => ms.every((m) => [...m.addedNodes, ...m.removedNodes].every((n) => n.nodeType !== 1 || n.classList.contains("rip")));
// Zamonaviy effektlar: ko’rinishda paydo bo’lish (stagger), 3D egilish va yorug’lik dog’i, o’qish chizig’i
const TILT = ".card,.ex>div,.why>div";
function useFx() {
  useEffect(() => {
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io = null, mo = null, raf = 0;
    if (!calm && "IntersectionObserver" in window) {
      const sel = ".card,.ex>div,.why>div,.gal>div,.faq details,.cc,section>h2,section>.sub,.stats span";
      io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.setAttribute("data-in", ""); io.unobserve(en.target); } }), { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
      // Eslatma: "ko’rilgan" belgisi shu effekt ichida saqlanadi (React dev rejimida effekt ikki marta ishlaydi —
      // belgi DOM atributida qolsa, elementlar yashirin holda qolib ketardi)
      const seen = new WeakSet();
      const scan = () => {
        raf = 0;
        document.querySelectorAll(sel).forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          if (el.hasAttribute("data-in")) return;
          el.setAttribute("data-rv", "");
          const idx = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
          el.style.setProperty("--d", Math.min(idx, 8) * 70 + "ms");
          io.observe(el);
        });
      };
      scan();
      mo = new MutationObserver((ms) => { if (!raf && !ripOnly(ms)) raf = requestAnimationFrame(scan); });
      mo.observe(document.body, { childList: true, subtree: true });
    }
    let last = null;
    const reset = (el) => ["--rx", "--ry", "--mx", "--my"].forEach((v) => el.style.removeProperty(v));
    const move = (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target.closest ? e.target.closest(TILT) : null;
      if (last && last !== el) reset(last);
      last = el;
      if (!el || calm) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((px - 0.5) * 7).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - py) * 7).toFixed(2) + "deg");
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => { document.removeEventListener("pointermove", move); if (io) io.disconnect(); if (mo) mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
}

// ===== Telefon va planshetlar uchun effektlar =====
// Sichqoncha yo’q — shuning uchun hover o’rniga: bosganda to’lqin (ripple) + yengil titrash,
// bosib turganda 3D egilish, ekran o’rtasidagi element "jonlanadi", bosh bo’lim skroll bilan xiralashadi
const PRESS = ".card,.ex>div,.why>div,.cc,.gal>div";
const RIPPLE = ".btn,.chip,.cc,.opt,.d,.lbb,.x,.admb";
function useTouchFx() {
  useEffect(() => {
    const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
    const touchy = mm("(hover: none), (pointer: coarse)");
    const calm = mm("(prefers-reduced-motion: reduce)");
    const undo = [];
    let pressed = null, holdEl = null, holdT = 0;
    const VARS = ["--rx", "--ry", "--mx", "--my"];

    const tilt = (e, el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - py) * 9).toFixed(2) + "deg");
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    };
    const down = (e) => {
      if (e.pointerType === "mouse" || !e.target || !e.target.closest) return;
      const rb = e.target.closest(RIPPLE);
      if (rb && !rb.disabled) {
        if (!calm) {
          const r = rb.getBoundingClientRect();
          const sp = document.createElement("span");
          sp.className = "rip";
          sp.setAttribute("aria-hidden", "true");
          sp.style.cssText = "--s:" + Math.round(Math.max(r.width, r.height) * 2.2) + "px;--x:" + Math.round(e.clientX - r.left) + "px;--y:" + Math.round(e.clientY - r.top) + "px";
          rb.appendChild(sp);
          sp.addEventListener("animationend", () => sp.remove(), { once: true });
          setTimeout(() => sp.remove(), 1000);
        }
        if (navigator.vibrate && rb.matches(".btn,.chip,.d")) { try { navigator.vibrate(8); } catch { /* ignore */ } }
      }
      const pr = e.target.closest(PRESS);
      if (pr && !calm) { pressed = pr; pr.setAttribute("data-press", ""); tilt(e, pr); }
      // logotip bosilsa — kompyuterdagi "hover" effekti ishlaydi
      const lg = e.target.closest(".logo");
      if (lg) { lg.setAttribute("data-tap", ""); clearTimeout(lg._t); lg._t = setTimeout(() => lg.removeAttribute("data-tap"), 1100); }
      // xizmat rasmini bosib turganda — katta ko’rinish (kompyuterdagi hover kabi)
      const row = e.target.closest(".ol p");
      if (row && row.querySelector(".oth.photo")) { holdEl = row; clearTimeout(holdT); holdT = setTimeout(() => row.setAttribute("data-hold", ""), 170); }
    };
    const move = (e) => { if (pressed && e.pointerType !== "mouse") tilt(e, pressed); };
    const up = () => {
      clearTimeout(holdT);
      if (holdEl) { holdEl.removeAttribute("data-hold"); holdEl = null; }
      if (!pressed) return;
      const el = pressed; pressed = null;
      el.removeAttribute("data-press");
      VARS.forEach((v) => el.style.removeProperty(v));
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    // rasmni uzoq bosganda chiqadigan Chrome menyusi ("Rasmni yuklab olish..." va h.k.) chiqmasin
    const ctx = (e) => { const t = e.target; if (t && t.closest && (t.tagName === "IMG" || t.closest(".oth,.gal,.im,.hero,.lbimg,.zoom,.pv"))) e.preventDefault(); };
    if (touchy) document.addEventListener("contextmenu", ctx);
    undo.push(() => {
      document.removeEventListener("contextmenu", ctx);
      document.removeEventListener("pointerdown", down); document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
    });

    if (touchy && !calm) {
      // Ekran o’rtasidagi element "jonlanadi" (data-live) — hover o’rnida
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => es.forEach((en) => en.target.toggleAttribute("data-live", en.isIntersecting)), { rootMargin: "-38% 0px -38% 0px", threshold: 0 });
        const seen = new WeakSet();
        let raf = 0;
        const scan = () => {
          raf = 0;
          document.querySelectorAll(PRESS).forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
        };
        scan();
        const mo = new MutationObserver((ms) => { if (!raf && !ripOnly(ms)) raf = requestAnimationFrame(scan); });
        mo.observe(document.body, { childList: true, subtree: true });
        undo.push(() => { io.disconnect(); mo.disconnect(); if (raf) cancelAnimationFrame(raf); });
      }
      // Bosh bo’lim: skroll bilan matn yuqoriga siljib xiralashadi, fon sekin kattalashadi
      let hraf = 0;
      const hs = () => {
        hraf = 0;
        const h = document.querySelector(".hero");
        if (!h) return;
        h.style.setProperty("--hp", Math.max(0, Math.min(window.scrollY, h.offsetHeight)).toFixed(0));
      };
      const hon = () => { if (!hraf) hraf = requestAnimationFrame(hs); };
      hs();
      window.addEventListener("scroll", hon, { passive: true });
      undo.push(() => { window.removeEventListener("scroll", hon); if (hraf) cancelAnimationFrame(hraf); });
    }
    return () => undo.forEach((f) => f());
  }, []);
}

// ===== Admin panel (#admin): bronlar ro’yxati va sanani bo’shatish. Parol: ADMIN_KEY (.env / Vercel) =====
function AdminPanel() {
  const [pw, setPw] = useState(() => { try { return sessionStorage.getItem("akey") || ""; } catch { return ""; } });
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const hallName = (id) => { const h = [...HALLS, ...BD_HALLS].find((x) => x.id === id); return h ? h.name[0] : id; };
  const load = (k) => {
    setBusy(true); setErr("");
    fetch("/api/bookings?all=1", { headers: { "x-admin-key": k }, cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) throw new Error("Parol noto’g’ri (yoki ADMIN_KEY sozlanmagan).");
        const j = await r.json().catch(() => null);
        if (!r.ok || !j || !j.ok) throw new Error("Server javob bermadi. Backend ulanganini tekshiring.");
        setList(j.bookings);
        try { sessionStorage.setItem("akey", k); } catch { /* ignore */ }
      })
      .catch((e) => { setErr(e.message || "Xato"); setList(null); })
      .finally(() => setBusy(false));
  };
  useEffect(() => { document.title = "Admin — " + CFG.name[0]; if (pw) load(pw); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const unlock = (b) => {
    if (!window.confirm(`${dot(b.date)} — ${hallName(b.hall)} sanasi bo’shatilsinmi? Mijoz bronini o’chirmaydi, faqat sanani ochadi.`)) return;
    fetch("/api/bookings", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-key": pw }, body: JSON.stringify({ hall: b.hall, date: b.date }) })
      .then((r) => { if (r.ok) load(pw); else setErr("O’chirib bo’lmadi."); }).catch(() => setErr("O’chirib bo’lmadi."));
  };
  const todayK = new Date().toISOString().slice(0, 10);
  return (
    <div className="admpg">
      <div className="wrap">
        <div className="admh">
          <h1 className="serif">Admin panel</h1>
          <a className="btn ghost sm" href="#" onClick={() => { window.location.hash = ""; }}>← Saytga</a>
        </div>
        <form className="admf" onSubmit={(e) => { e.preventDefault(); load(pw); }}>
          <input className="i" type="password" autoComplete="current-password" placeholder="Admin paroli" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Admin paroli" />
          <button className="btn" type="submit" disabled={busy || !pw}>{busy ? "..." : list ? "Yangilash" : "Kirish"}</button>
        </form>
        {err && <p className="admerr" role="alert">{err}</p>}
        {list && (
          <>
            <p className="admn">Jami: <b>{list.length}</b> ta band sana · kelgusi: <b>{list.filter((b) => b.date >= todayK).length}</b></p>
            {list.length === 0 && <p className="admn">Hozircha bron yo’q.</p>}
            <div className="admlist">
              {list.map((b) => (
                <div key={b.hall + b.date} className={"admrow" + (b.date < todayK ? " old" : "")}>
                  <div className="admd"><b>{dot(b.date)}</b><span>{hallName(b.hall)}</span></div>
                  <div className="admc"><b>{b.name}</b><a href={`tel:${b.phone}`}>{b.phone}</a><span>{b.guests ? b.guests + " kishi · " : ""}{b.total ? fmt(b.total, "so’m") : ""}</span></div>
                  <button className="btn ghost sm" onClick={() => unlock(b)}>Sanani bo’shatish</button>
                  <details className="admt"><summary>Tafsilot</summary><p>{b.text}</p><small>{b.createdAt ? new Date(b.createdAt).toLocaleString("uz-UZ") : ""}</small></details>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => {
    try { const l = localStorage.getItem("lang"); return LANGS.includes(l) ? l : "uz"; } catch { return "uz"; }
  });
  const [mode, setMode] = useState("toy"); // "toy" (to’yxona) yoki "bd" (tug’ilgan kun)
  const [open, setOpen] = useState(null); // null yoki zal id
  const [lb, setLb] = useState(null);     // null yoki galereya indeksi
  const [booked, setBooked] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bron") || "[]"); } catch { return []; }
  });
  const bd = mode === "bd", M = MODES[mode];
  const t = T[lang], li = LANGS.indexOf(lang), P = (x) => pick(x, li), F = (n) => fmt(n, t.cur);
  const tm = bd ? { ...t, ...t.bd } : t; // shu sahifaga tegishli matnlar
  const [adminRoute, setAdminRoute] = useState(() => window.location.hash === "#admin");
  useEffect(() => {
    const f = () => setAdminRoute(window.location.hash === "#admin");
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useFx();
  useTouchFx();
  const gal = useMemo(() => (bd ? mkGal(PHOTOS.bd.gal, 4) : GAL), [bd]);
  const hallPhoto = (h) => (bd ? PHOTOS.bd[h.ph] : PHOTOS[h.id]);

  const [serverBooked, setServerBooked] = useState([]);
  const [serverOn, setServerOn] = useState(false); // true — bronlar serverda saqlanadi
  const waText = bd
    ? "Assalomu alaykum! Farzandimning tug’ilgan kun bayrami bo’yicha so’rayman."
    : "Assalomu alaykum! To’yxonangiz bo’yicha so’rayman.";

  const switchMode = (m) => { setMode(m); setOpen(null); setLb(null); window.scrollTo({ top: 0 }); };

  // Backend (api/bookings.js): band sanalar serverdan olinadi — hamma foydalanuvchi uchun bir xil, qulflangan.
  const loadBooked = () => fetch("/api/bookings", { cache: "no-store" })
    .then((r) => (r.ok && (r.headers.get("content-type") || "").includes("json") ? r.json() : null))
    .then((j) => { if (j && Array.isArray(j.booked)) { setServerBooked(j.booked); setServerOn(!!j.store); } }).catch(() => {});
  useEffect(() => {
    loadBooked();
    const iv = setInterval(loadBooked, 20000);
    const vis = () => document.visibilityState === "visible" && loadBooked();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", vis); };
  }, []);
  // Tug’ilgan kun sahifasida brauzer belgisi (favicon) ham tug’ilgan kun rasmiga almashadi
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    if (!link.dataset.def) link.dataset.def = link.getAttribute("href");
    if (!bd) { link.setAttribute("href", link.dataset.def); link.removeAttribute("type"); return; }
    const img = new Image();
    img.onload = () => { link.setAttribute("href", PHOTOS.logoBd); link.removeAttribute("type"); };
    img.src = PHOTOS.logoBd;
  }, [bd]);
  useEffect(() => { try { localStorage.setItem("bron", JSON.stringify(booked)); } catch { /* ignore */ } }, [booked]);
  useEffect(() => {
    try { localStorage.setItem("lang", lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
    document.documentElement.dataset.mode = mode;
    document.title = `${CFG.name[li]} — ${tm.place.split(" · ")[0]}`;
  }, [lang, li, tm, mode]);

  if (adminRoute) return <AdminPanel />;

  return (
    <>
      <nav className={bd ? "bdn" : ""}><div className="wrap">
        <Logo li={li} bd={bd} />
        <span className="navr">
          <NavDock labels={[["Bosh sahifa", "Главная", "Home"][li], t.zallar, t.xizmat, t.galereya, t.aloqa]} dep={lang} />
          <span className="lang" role="group" aria-label="Language">
            {LANGS.map((l) => <button key={l} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
          </span>
          <button className="btn ghost sm modebtn" onClick={() => switchMode(bd ? "toy" : "bd")}>{bd ? t.modeToy : t.modeBd}</button>
          <button className="btn sm" onClick={() => setOpen(M.firstHall)}>{t.book}</button>
        </span>
      </div></nav>

      <div className="hero" id="bosh">
        <Pic url={bd ? PHOTOS.bd.hero : PHOTOS.hero} pal={bd ? ["#d6336c", "#ffd43b"] : ["#7a2a18", "#d9a35a"]} n={1} />
        <div className="in" key={mode}>
          <small>{tm.place}</small>
          <h1>{tm.h1}</h1>
          <p>{tm.heroP}</p>
          <button className="btn" onClick={() => setOpen(M.firstHall)}>{tm.heroCta}</button>
          <div className="stats">
            <span><b>{bd ? 120 : 600}</b>{tm.s1}</span><span><b>3</b>{tm.s2}</span><span><b>{bd ? CHARS.length : "10+"}</b>{tm.s3}</span>
          </div>
        </div>
      </div>

      <div className="wrap mw" key={mode}>
        <section id="zallar">
          <h2>{tm.hallsT}</h2><p className="sub">{tm.hallsSub}</p>
          <div className="cards">
            {M.halls.map((h, i) => (
              <div className="card" key={h.id}>
                <div className="im"><Pic url={hallPhoto(h)} pal={h.pal} n={i + 2} /></div>
                <div className="bd">
                  <h3>{P(h.name)}</h3><p>{P(h.desc)}</p>
                  <div className="pr">{bd ? `${F(h.price)} / ${t.perHr}` : `${F(h.price)} ${t.from}`}</div>
                  <button className="btn sm" onClick={() => setOpen(h.id)}>{tm.bookHall}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="xizmat" className="exsec"
          style={(bd ? PHOTOS.bd.hero : PHOTOS.exBg) ? { backgroundImage: `linear-gradient(rgba(15,11,8,.78),rgba(15,11,8,.9)),url("${bd ? PHOTOS.bd.hero : PHOTOS.exBg}")` } : undefined}>
          <h2>{tm.exT}</h2><p className="sub">{tm.exSub}</p>
          <div className="ex">
            {M.ex.map((e) => (
              <div key={e.id}>
                <Ico e={e} big /><b>{P(e.name)}</b><span>{P(e.d)}</span>
                <div className="ol">{e.o.map((o, i) => <p key={i}><span className="oi"><OptThumb e={e} i={i} label={P(o[0])} /><span>{P(o[0])}</span></span><em>{F(o[1])}{e.hr ? ` / ${t.hr}` : ""}</em></p>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="nega">
          <h2>{t.whyT}</h2>
          <div className="why">
            {t.whyL.map(([h, d], i) => (
              <div key={i}><span className="wn">{i + 1}</span><b>{h}</b><span className="wd">{d}</span></div>
            ))}
          </div>
        </section>

        <section id="galereya">
          <h2>{tm.galT}</h2><p className="sub">{tm.galSub}</p>
          <div className="gal">
            {gal.map((g, i) => (
              <div key={i} role="button" tabIndex={0} onClick={() => setLb(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setLb(i))}>
                <Pic url={g.url} pal={g.pal} n={g.n} fit />
              </div>
            ))}
          </div>
        </section>

        <section id="faq">
          <h2>{tm.faqT || t.faqT}</h2>
          <div className="faq">
            {(tm.faq || t.faq).map(([q, a], i) => (
              <details key={i}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </section>

        <footer id="aloqa" className="contact">
          <h2>{t.q}</h2>
          <p className="sub">{t.cSub}</p>
          <div className="admcard">
            <span className="ci" aria-hidden="true">🧑‍💼</span>
            <span className="admt"><b>{t.adminT}</b><small>{t.adminSub}</small></span>
            <a className="btn sm" href={`https://t.me/${CFG.admin.tg}?text=${encodeURIComponent(t.adminMsg)}`} target="_blank" rel="noopener noreferrer">{t.adminBtn}</a>
          </div>
          <div className="cgrid">
            {CFG.phones.map(([tel, shown]) => (
              <a className="cc" key={tel} href={`tel:${tel}`}>
                <span className="ci" aria-hidden="true">📞</span><span><small>{t.call}</small><b>{shown}</b></span>
              </a>
            ))}
            <a className="cc tgc" href={`https://t.me/${CFG.tg}`} target="_blank" rel="noopener noreferrer">
              <span className="ci" aria-hidden="true">✈️</span><span><small>{t.writeTg}</small><b>@{CFG.tg}</b></span>
            </a>
            <a className="cc wac" href={`https://wa.me/${CFG.phones[0][0].replace("+", "")}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer">
              <span className="ci" aria-hidden="true">{bd ? "🎂" : "💬"}</span><span><small>{t.wa}</small><b>{CFG.phones[0][1]}</b></span>
            </a>
            {CFG.ig && (
              <a className="cc" href={`https://instagram.com/${CFG.ig}`} target="_blank" rel="noopener noreferrer">
                <span className="ci" aria-hidden="true">📷</span><span><small>Instagram</small><b>@{CFG.ig}</b></span>
              </a>
            )}
            <div className="cc">
              <span className="ci" aria-hidden="true">📍</span><span><small>{t.addrL}</small><b>{CFG.addr[li]}</b></span>
            </div>
          </div>
          <div className="map">
            <iframe title="Map" loading="lazy" decoding="async" referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(CFG.mapQ)}&output=embed&hl=${lang}`} />
            <a className="btn sm" target="_blank" rel="noopener noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CFG.mapQ)}`}>📍 {t.route}</a>
          </div>
        </footer>
      </div>

      <AdminChat t={t} lang={lang} />

      <a className="fab" href={`tel:${CFG.phones[0][0]}`} aria-label={t.call}>📞</a>

      <div className="bar"><button className="btn" onClick={() => setOpen(M.firstHall)}>{tm.heroCta}</button></div>

      {open && <BookingModal key={"m-" + mode} lang={lang} mode={mode} initialHall={open} booked={serverOn ? serverBooked : [...booked, ...serverBooked]} onBooked={(b) => setBooked((l) => [...l, b])} onSynced={loadBooked} onClose={() => setOpen(null)} />}
      {lb !== null && <Lightbox t={t} gal={gal} i={lb} setI={setLb} onClose={() => setLb(null)} />}
    </>
  );
}
