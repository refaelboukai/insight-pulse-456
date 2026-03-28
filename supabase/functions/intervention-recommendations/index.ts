import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, studentName, reason, consecutiveDays } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get recent support sessions and last reports before absence
    const [supportRes, reportsRes, followupsRes] = await Promise.all([
      sb.from("support_sessions").select("*").eq("student_id", studentId).order("session_date", { ascending: false }).limit(5),
      sb.from("lesson_reports").select("*").eq("student_id", studentId).order("report_date", { ascending: false }).limit(10),
      sb.from("absent_student_followups").select("*").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1),
    ]);

    const context = `שם: ${studentName}
סיבת היעדרות: ${reason}
ימי היעדרות רצופים: ${consecutiveDays}
תמיכות אחרונות: ${JSON.stringify((supportRes.data || []).map(s => ({ date: s.session_date, types: s.support_types, notes: s.notes })))}
דיווחים אחרונים לפני ההיעדרות: ${JSON.stringify((reportsRes.data || []).slice(0, 5).map(r => ({ date: r.report_date, behavior: r.behavior_types, attendance: r.attendance })))}
מעקב קיים: ${JSON.stringify(followupsRes.data?.[0] || "אין")}`;

    const prompt = `הצע פעולות מעקב עבור ${studentName} שנעדר ${consecutiveDays} ימים רצוף.

${context}

הנחיות:
1. הצע 3-4 פעולות קונקרטיות שהצוות יכול לבצע מיד
2. כל פעולה = משפט אחד קצר, פעולה אחת ברורה
3. התאם את ההמלצות לסיבת ההיעדרות ולהיסטוריה
4. דוגמאות: "ליצור קשר טלפוני עם ההורים", "לשלוח חומרי לימוד בוואטסאפ", "לתאם ביקור בית"
5. מספר כל פעולה (1. 2. 3.)
6. אל תשתמש בכוכביות או מרקדאון
7. כתוב בעברית`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה יועץ חינוכי בבית ספר טיפולי. תפקידך להציע פעולות מעקב קצרות ופרקטיות עבור תלמידים שנעדרים לאורך זמן. כתוב בעברית." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד דקה" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום נוסף" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recommendations = data.choices?.[0]?.message?.content || "לא ניתן לייצר המלצות";

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intervention-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
