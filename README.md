# محوّل العملات — Currency Converter PWA

تطبيق ويب تقدمي (PWA) لتحويل العملات بواجهة عربية كاملة، يعمل أونلاين وأوفلاين.

---

## ✨ المميزات

| الميزة | الوصف |
|---|---|
| 💱 تحويل لحظي | نتيجة فورية عند الكتابة أو الضغط على زر التحويل |
| 🌐 أسعار حية | تُجلب من Frankfurter API (مجاني، بدون مفتاح) |
| 📶 وضع أوفلاين | يستخدم آخر أسعار محفوظة تلقائياً عند انقطاع الإنترنت |
| 🔔 إشعارات تلقائية | يُحدّث الأسعار فور استعادة الاتصال ويُعلم المستخدم |
| 📱 PWA | قابل للتثبيت على الشاشة الرئيسية للموبايل والكمبيوتر |
| 🌙 واجهة داكنة | تصميم مالي احترافي بألوان داكنة |
| ♿ سهل الوصول | دعم كامل للقراء الإلكترونية و ARIA |

---

## 💰 العملات المدعومة

- 🇺🇸 **USD** — دولار أمريكي  
- 🇪🇺 **EUR** — يورو أوروبي  
- 🇬🇧 **GBP** — جنيه إسترليني  
- 🇧🇦 **BAM** — مارك بوسني  
- 🇸🇦 **SAR** — ريال سعودي  

---

## 📁 هيكل المشروع

```
currency-converter/
├── index.html        ← صفحة التطبيق الرئيسية (عربي RTL)
├── style.css         ← التصميم الكامل (داكن، متجاوب)
├── script.js         ← المنطق: API، تحويل، أوفلاين، SW
├── sw.js             ← Service Worker للتخزين المؤقت
├── manifest.json     ← بيانات PWA للتثبيت
├── icons/            ← أيقونات التطبيق (192×192 و 512×512)
│   ├── icon-192.png
│   └── icon-512.png
└── README.md         ← هذا الملف
```

---

## 🚀 التشغيل المحلي

### الطريقة 1: خادم Python بسيط (موصى به)

```bash
# Python 3
python3 -m http.server 8080

# أو Python 2
python -m SimpleHTTPServer 8080
```

ثم افتح المتصفح على: `http://localhost:8080`

> ⚠️ **مهم:** يجب تشغيل التطبيق عبر خادم HTTP (وليس فتح index.html مباشرة)  
> لأن الـ Service Worker يتطلب سياق HTTP أو HTTPS.

### الطريقة 2: VS Code Live Server

1. افتح المجلد في VS Code
2. ثبّت امتداد **Live Server**
3. انقر بزر الماوس الأيمن على `index.html` واختر *"Open with Live Server"*

### الطريقة 3: Node.js serve

```bash
npx serve .
```

---

## 🌍 النشر على GitHub Pages

```bash
# 1. أنشئ مستودع جديد على GitHub

# 2. ارفع الملفات
git init
git add .
git commit -m "Initial commit: Currency Converter PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main

# 3. فعّل GitHub Pages
# Settings → Pages → Source: "Deploy from a branch" → Branch: main / root
```

الرابط سيكون: `https://USERNAME.github.io/REPO_NAME`

---

## 🖼️ إضافة الأيقونات

أنشئ مجلد `icons/` وضع فيه صورتين:

| الملف | الحجم | الاستخدام |
|---|---|---|
| `icons/icon-192.png` | 192×192 px | أندرويد / Chrome |
| `icons/icon-512.png` | 512×512 px | Splash screen |

### توليد الأيقونات تلقائياً:

```bash
# باستخدام ImageMagick
convert -size 512x512 xc:"#0e1923" \
  -fill "#4fffb0" -font "DejaVu-Sans-Bold" \
  -pointsize 200 -gravity center \
  -annotate 0 "₿" icon-512.png

convert -resize 192x192 icon-512.png icons/icon-192.png
convert -resize 512x512 icon-512.png icons/icon-512.png
```

أو استخدم أي أداة تصميم (Canva، Figma، إلخ) لإنشاء أيقونة بخلفية `#0e1923`.

---

## 🔌 مصدر بيانات الأسعار

يستخدم التطبيق **[Frankfurter API](https://www.frankfurter.app/)**:

- مجاني تماماً — لا يحتاج مفتاح API
- محدوث يومياً من البنك المركزي الأوروبي (ECB)
- يدعم أكثر من 30 عملة
- معدل الاستخدام: غير مقيّد للاستخدام الشخصي

**نقطة الطلب المستخدمة:**
```
GET https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,BAM,SAR
```

---

## ⚡ كيف يعمل الأوفلاين؟

```
أول تشغيل (أونلاين):
  → جلب أسعار من API
  → حفظها في localStorage
  → تخزين ملفات التطبيق في Cache API (عبر SW)

عند انقطاع الإنترنت:
  → يقرأ الأسعار من localStorage
  → يُظهر "🟡 مخزّن" بجانب التاريخ
  → يُظهر شريط تنبيه أحمر أعلى الشاشة

عند استعادة الاتصال:
  → يُحدّث الأسعار تلقائياً في الخلفية
  → يُظهر شريط أخضر + رسالة نجاح

أول تشغيل (أوفلاين / بدون بيانات مخزّنة):
  → يستخدم أسعاراً افتراضية مضمّنة في الكود
  → يُظهر "🔴 افتراضي"
```

---

## 🧪 اختبار وضع الأوفلاين

**في Chrome DevTools:**
1. افتح DevTools (`F12`)
2. اذهب إلى تبويب **Network**
3. اختر **"Offline"** من القائمة المنسدلة
4. أعد تحميل الصفحة — يجب أن يستمر التطبيق في العمل!

---

## 📱 تثبيت كتطبيق (PWA)

**على أندرويد (Chrome):**
- ستظهر رسالة "إضافة إلى الشاشة الرئيسية" تلقائياً
- أو: القائمة ≡ → "تثبيت التطبيق"

**على iOS (Safari):**
- اضغط على زر المشاركة 📤
- اختر "إضافة إلى الشاشة الرئيسية"

**على سطح المكتب (Chrome/Edge):**
- ستظهر أيقونة تثبيت في شريط العناوين
- أو: القائمة → "تثبيت محوّل العملات"

---

## 🛠️ تخصيص الكود

### إضافة عملة جديدة

**في `script.js`:**
```js
// 1. أضف إلى القائمة
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'BAM', 'SAR', 'AED'];

// 2. أضف البيانات الوصفية
const CURRENCY_META = {
  // ...
  AED: { name: 'درهم إماراتي', flag: '🇦🇪', symbol: 'د.إ' },
};

// 3. أضف سعراً افتراضياً
const FALLBACK_RATES = {
  // ...
  AED: 3.67,
};
```

**في `index.html`:** أضف `<option>` في كلا الـ `<select>`
**في `sw.js`:** لا تغيير مطلوب

---

## 📄 الترخيص

MIT License — حر الاستخدام والتعديل والتوزيع.

---

*صُنع بـ ❤️ · واجهة عربية كاملة · يعمل أونلاين وأوفلاين*
