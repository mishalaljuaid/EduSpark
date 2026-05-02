// ============================================================
// EduSpark — Supabase Edge Function: verify-payment
// المسار: supabase/functions/verify-payment/index.ts
//
// هذه الدالة تتحقق من الدفع مع ميسر بشكل آمن
// المفتاح السري لا يظهر أبداً في المتصفح
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, paymentId } = await req.json();

    if (!orderId || !paymentId) {
      return new Response(
        JSON.stringify({ error: "orderId و paymentId مطلوبان" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // المفتاح السري محفوظ في متغيرات البيئة — لا يظهر أبداً للمتصفح
    const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY")!;

    // 1️⃣ التحقق من الدفع مع ميسر
    const moyasarResp = await fetch(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: "Basic " + btoa(MOYASAR_SECRET_KEY + ":"),
          "Content-Type": "application/json",
        },
      }
    );

    if (!moyasarResp.ok) {
      throw new Error("فشل الاتصال بميسر");
    }

    const payment = await moyasarResp.json();

    // 2️⃣ إنشاء Supabase client بصلاحيات الخادم (service role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (payment.status === "paid") {
      // 3️⃣ جلب بيانات الطلب لإنشاء روابط التحميل
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) {
        throw new Error("الطلب غير موجود");
      }

      // 4️⃣ إنشاء روابط تحميل مؤقتة (صالحة 24 ساعة) لكل ملف
      const downloadUrls: Record<string, string> = {};
      const items = order.items as Array<{ product_id: string; file_path?: string }>;

      for (const item of items) {
        if (item.file_path) {
          const { data: urlData } = await supabase.storage
            .from("eduspark-files")
            .createSignedUrl(item.file_path, 86400); // 24 ساعة

          if (urlData?.signedUrl) {
            downloadUrls[item.product_id] = urlData.signedUrl;
          }
        }
      }

      // 5️⃣ تحديث حالة الطلب في قاعدة البيانات
      await supabase
        .from("orders")
        .update({
          status: "paid",
          moyasar_payment_id: paymentId,
          download_urls: downloadUrls,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // 6️⃣ تحديث عداد التحميلات لكل منتج
      for (const item of items) {
        await supabase.rpc("increment_downloads", { product_id: item.product_id });
      }

      return new Response(
        JSON.stringify({ success: true, downloadUrls }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // الدفع لم يكتمل
    await supabase
      .from("orders")
      .update({ status: "failed", moyasar_payment_id: paymentId })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: false, status: payment.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
