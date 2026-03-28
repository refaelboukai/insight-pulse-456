import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, studentName, subjectName, currentMonth, currentGoal } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get recent reports for the subject and grades
    const [reportsRes, gradesRes] = await Promise.all([
      sb.from("lesson_reports").select("*").eq("student_id", studentId).eq("lesson_subject", subjectName).order("report_date", { ascending: false }).limit(15),
      sb.from("student_grades").select("*").eq("student_id", studentId).eq("subject", subjectName).order("created_at", { ascending: false }).limit(3),
    ]);

    const context = `תלמיד: ${studentName}
מקצוע: ${subjectName}
חודש נוכחי: ${currentMonth}
יעד נוכחי (אם קיים): ${currentGoal ? JSON.stringify({
  status: currentGoal.current_status,
  goals: currentGoal.learning_goals,
  done: currentGoal.what_was_done,
  notDone: currentGoal.what_was_not_done,
}) : "אין יעד קיים"}
דיווחי שיעורים אחרונים: ${JSON.stringify((reportsRes.data || []).map(r => ({
  date: r.report_date, attendance: r.attendance, behavior: r.behavior_types,
  participation: r.participation, comment: r.comment,
})))}
ציונים אחרונים: ${JSON.stringify((gradesRes.data || []).map(g => ({
  grade: g.grade, evaluation: g.verbal_evaluation,
})))}`;

    const prompt = `הצע יעדים פדגוגיים לחודש הבא עבור ${studentName} במקצוע ${subjectName}.

${context}

הנחיות:
1. הצע "מצב נוכחי" — משפט אחד מסכם
2. הצע "יעדים" — 2-3 יעדים קצרים וקונקרטיים
3. הצע "דרכי מדידה" — 1-2 דרכים למדוד התקדמות
4. התבסס על הנתונים בלבד, בלי לנחש
5. אל תשתמש בכוכביות או מרקדאון
6. מספר כל סעיף (1. 2. 3.)
7. כתוב בעברית, תמציתי ופרקטי

פורמט:
מצב נוכחי:
[משפט]

יעדים מוצעים:
1. [יעד]
2. [יעד]

דרכי מדידה:
1. [דרך]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה יועץ פדגוגי בבית ספר טיפולי. תפקידך להציע יעדים לימודיים קצרים ופרקטיים לחודש הבא על בסיס ביצועי התלמיד. כתוב בעברית." },
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
    const suggestions = data.choices?.[0]?.message?.content || "לא ניתן לייצר הצעות";

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-goals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
