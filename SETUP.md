# 🚀 دليل إعداد EduSpark — خطوة بخطوة

## الملفات التي ستجدها في هذا المجلد

```
eduspark/
├── index.html              ←  المتجر الرئيسي
├── admin.html              ← لوحة التحكم (محمية بتسجيل دخول)
├── payment-success.html    ← صفحة ما بعد الدفع
├── schema.sql              ← قاعدة البيانات
├── functions/
│   └── verify-payment/
│       └── index.ts        ← الدالة الآمنة (التحقق من ميسر)
└── SETUP.md                ← هذا الدليل
```

---


## الخطوة 1 — إنشاء حساب Supabase (مجاني)

1. اذهب إلى **https://supabase.com** → اضغط "Start for free"
2. سجّل بحساب GitHub أو Google
3. اضغط **New Project**
4. اختر اسماً للمشروع (مثل: `eduspark`) وكلمة مرور قوية
5. انتظر دقيقتين حتى يُنشأ المشروع

### بعد الإنشاء، احفظ هذه المفاتيح:
اذهب إلى **Settings → API** وانسخ:
- `Project URL` → هذا هو `SUPABASE_URL`
- `anon / public` key → هذا هو `SUPABASE_ANON`
- `service_role` key → هذا سري للغاية (للـ Edge Function فقط)

---

## الخطوة 2 — إعداد قاعدة البيانات

1. في Supabase، اذهب إلى **SQL Editor**
2. انسخ محتوى ملف `schema.sql` كاملاً
3. اضغط **Run** (▶)
4. يجب أن ترى "Success" بدون أخطاء

---

## الخطوة 3 — إعداد Storage (لحفظ الملفات)

1. في Supabase، اذهب إلى **Storage**
2. اضغط **New Bucket**
3. الاسم: `eduspark-files`
4. Public: **لا** (خاص — روابط مؤقتة آمنة فقط)
5. اضغط **Create**

---

## الخطوة 4 — إنشاء حساب المدير

1. في Supabase، اذهب إلى **Authentication → Users**
2. اضغط **Add User → Create new user**
3. أدخل بريدك الإلكتروني وكلمة مرور قوية
4. هذه بيانات دخول لوحة التحكم (`admin.html`)

---

## الخطوة 5 — إنشاء حساب Moyasar

1. اذهب إلى **https://moyasar.com**
2. سجّل حساباً تجارياً (تحتاج سجل تجاري سعودي)
3. بعد التفعيل، اذهب إلى **API Keys**
4. احفظ:
   - `Publishable Key` (يبدأ بـ `pk_`) → آمن في المتصفح ✓
   - `Secret Key` (يبدأ بـ `sk_`) → سري للغاية، Edge Function فقط 🔒

> **للاختبار:** استخدم مفاتيح الـ Test بدلاً من Live

---

## الخطوة 6 — نشر Edge Function (دالة التحقق الآمن)

تحتاج Supabase CLI:

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref YOUR_PROJECT_REF

# نشر الدالة
supabase functions deploy verify-payment

# إضافة المفاتيح السرية (لا تكتبها في الكود أبداً!)
supabase secrets set MOYASAR_SECRET_KEY=sk_live_YOUR_SECRET_KEY
```

الـ `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` تُضاف تلقائياً من Supabase.

---

## الخطوة 7 — ضع مفاتيحك في الملفات

افتح `index.html` و `admin.html` و `payment-success.html` وعدّل هذه الأسطر:

```javascript
// في أعلى كل ملف — ابحث عن هذه الأسطر وعدّلها
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';    // ← ضع رابطك
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';              // ← ضع مفتاح anon
const MOYASAR_PUB   = 'pk_test_YOUR_PUBLISHABLE_KEY';        // ← في index.html فقط
```

> ⚠️ **لا تضع `MOYASAR_SECRET_KEY` أو `service_role` في أي ملف HTML أبداً!**

---

## الخطوة 8 — الاستضافة على Vercel (مجاني)

1. اذهب إلى **https://vercel.com** → سجّل بـ GitHub
2. اضغط **New Project**
3. ارفع مجلد `eduspark` (أو ادفعه لـ GitHub أولاً)
4. اضغط **Deploy** — سينتهي خلال دقيقة
5. ستحصل على رابط مثل: `https://eduspark.vercel.app`

> **HTTPS تلقائي** ← ضروري لميسر ✓

---

## الخطوة 9 — تحديث رابط callback في ميسر

في إعدادات ميسر، أضف رابط موقعك كـ **Allowed Callback URL**:
```
https://eduspark.vercel.app/payment-success.html
```

---

## ✅ الاختبار النهائي

1. افتح المتجر (`index.html`) وأضف منتجاً للسلة
2. اضغط "متابعة الدفع"، أدخل اسمك وبريدك
3. استخدم بطاقة الاختبار من ميسر: `4111 1111 1111 1111`
4. تحقق من:
   - ظهور الطلب في لوحة التحكم
   - تحويل الحالة إلى "مدفوع"
   - ظهور رابط التحميل في صفحة النجاح

---

## 🔒 ملخص الأمان

| العنصر | الموقع | الأمان |
|--------|--------|--------|
| Supabase Anon Key | في HTML | ✅ آمن (للقراءة العامة فقط) |
| Moyasar Publishable Key | في HTML | ✅ آمن (مصمم للمتصفح) |
| Moyasar Secret Key | Edge Function env | 🔒 سري (لا يظهر أبداً) |
| Supabase Service Role | Edge Function env | 🔒 سري (لا يظهر أبداً) |
| RLS Policies | Supabase | 🔒 محمي (فقط المدير يعدّل) |
| HTTPS | Vercel تلقائي | 🔒 إلزامي |
| Admin Auth | Supabase Auth | 🔒 JWT آمن |

---

## 📞 للمساعدة

- Supabase Docs: https://supabase.com/docs
- Moyasar Docs: https://docs.moyasar.com
- Vercel Docs: https://vercel.com/docs
