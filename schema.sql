-- ============================================================
-- EduSpark — Supabase Database Schema
-- انسخ هذا الكود كاملاً في Supabase > SQL Editor > Run
-- ============================================================

-- ---- جدول المنتجات ----
CREATE TABLE products (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar       TEXT NOT NULL,
  name_en       TEXT,
  desc_ar       TEXT,
  desc_en       TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price > 0),
  type          TEXT NOT NULL CHECK (type IN ('pdf','word','ppt','zip')),
  grade         TEXT NOT NULL,
  featured      BOOLEAN DEFAULT FALSE,
  file_path     TEXT,           -- المسار في Supabase Storage
  downloads     INTEGER DEFAULT 0,
  rating        NUMERIC(3,1) DEFAULT 5.0,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---- جدول الطلبات ----
CREATE TABLE orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_email         TEXT NOT NULL,
  buyer_name          TEXT,
  items               JSONB NOT NULL,   -- [{product_id, name, price}]
  total               NUMERIC(10,2) NOT NULL,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  moyasar_payment_id  TEXT,
  download_urls       JSONB,            -- روابط تحميل مؤقتة تُولَّد بعد الدفع
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  paid_at             TIMESTAMPTZ
);

-- ============================================================
-- Row Level Security (حماية البيانات)
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;

-- المنتجات: أي شخص يقرأ، المدير فقط يعدّل
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (active = TRUE);

CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- الطلبات: أي شخص ينشئ طلباً، المدير فقط يرى الكل
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "orders_admin_select"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "orders_system_update"
  ON orders FOR UPDATE
  USING (TRUE);

-- ============================================================
-- Storage Bucket للملفات
-- ============================================================
-- اذهب إلى Supabase > Storage > New Bucket
-- الاسم: eduspark-files
-- Public: FALSE (خاص، روابط مؤقتة فقط)

-- ============================================================
-- بيانات تجريبية (اختياري)
-- ============================================================
INSERT INTO products (name_ar, name_en, desc_ar, desc_en, price, type, grade, featured)
VALUES
  ('ورقة عمل القواعد - الأفعال والأزمنة', 'Grammar Worksheet — Verbs & Tenses',
   'ورقة عمل شاملة جاهزة للطباعة مع مفاتيح الإجابات', 'Print-ready grammar worksheets with answer keys',
   45, 'pdf', '5', TRUE),
  ('حزمة بطاقات المفردات - الصف الثالث', 'Grade 3 Vocabulary Flash Cards',
   'بطاقات جاهزة للطباعة لمراجعة المفردات الأساسية', 'Ready-to-print vocabulary flash cards',
   35, 'zip', '3', FALSE),
  ('تحضيرات الفهم القرائي - الفصل الأول', 'Reading Comprehension Lesson Plans T1',
   'تحضيرات دروس جاهزة بمستويات متدرجة', 'Ready-made lesson plans with differentiated passages',
   55, 'word', '8', TRUE);
