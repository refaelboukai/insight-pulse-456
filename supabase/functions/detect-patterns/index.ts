import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, studentName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fromDate = twoWeeksAgo.toISOString();

    const [reportsRes, attendanceRes] = await Promise.all([
      sb.from("lesson_reports").select("*").eq("student_id", studentId).gte("report_date", fromDate).order("report_date"),
      sb.from("daily_attendance").select("*").eq("student_id", studentId).gte("attendance_date", twoWeeksAgo.toISOString().split("T")[0]).order("attendance_date"),
    ]);

    const reports = reportsRes.data || [];
    const attendance = attendanceRes.data || [];

    if (reports.length === 0 && attendance.length === 0) {
      return new Response(JSON.stringify({ patterns: "אין מספיק נתונים לניתוח דפוסים (נדרשים לפחות שבועיים של דיווחים)." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataContext = `דיווחי שיעורים (${reports.length}):
${JSON.stringify(reports.map(r => ({
  date: r.report_date, subject: r.lesson_subject, attendance: r.attendance,
  behavior: r.behavior_types, participation: r.participation,
  severity: r.behavior_severity, comment: r.comment,
})), null, 2)}

נוכחות יומית (${attendance.length}):
${JSON.stringify(attendance.map(a => ({
  date: a.attendance_date, present: a.is_present, reason: a.absence_reason,
})), null, 2)}`;

    const prompt = `נתח את הנתונים של ${studentName} מ-14 הימים האחרונים וזהה דפוסים.

${dataContext}

הנחיות:
1. זהה 2-4 דפוסים בולטים: מגמות חיוביות, ירידות, חזרות
2. כל דפוס = משפט אחד קצר וברור
3. ציין מקצועות ספציפיים אם רלוונטי
4. אל תוסיף המלצות — רק תצפיות עובדתיות
5. מספר כל דפוס (1. 2. 3.)
6. אל תשתמש בכוכביות או מרקדאון
7. כתוב בעברית, גוף שלישי`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה מערכת ניתוח דפוסים בבית ספר. תפקידך לזהות מגמות ודפוסים בנתוני תלמידים בצורה עובדתית, קצרה וברורה. כתוב בעברית." },
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
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const patterns = data.choices?.[0]?.message?.content || "לא ניתן לזהות דפוסים";

    return new Response(JSON.stringify({ patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-patterns error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
