import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId, studentName, summaryText, weekStart } = await req.json();

    if (!studentId || !studentName || !summaryText) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch weekly data for context
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const [{ data: reports }, { data: attendance }, { data: supportSessions }] = await Promise.all([
      supabase
        .from("lesson_reports")
        .select("lesson_subject, attendance, behavior_types, participation, comment")
        .eq("student_id", studentId)
        .gte("report_date", weekStart)
        .lte("report_date", weekEndStr + "T23:59:59"),
      supabase
        .from("daily_attendance")
        .select("attendance_date, is_present, absence_reason")
        .eq("student_id", studentId)
        .gte("attendance_date", weekStart)
        .lte("attendance_date", weekEndStr),
      supabase
        .from("support_sessions")
        .select("support_types, notes")
        .eq("student_id", studentId)
        .gte("session_date", weekStart)
        .lte("session_date", weekEndStr),
    ]);

    // Build data context
    let dataContext = "";

    if (reports && reports.length > 0) {
      const behaviorSummary = reports.map(r => 
        `${r.lesson_subject}: נוכחות ${r.attendance === 'full' ? 'מלאה' : r.attendance === 'partial' ? 'חלקית' : 'נעדר'}, התנהגות: ${(r.behavior_types || []).join(",")}, השתתפות: ${(r.participation || []).join(",")}`
      ).join("; ");
      dataContext += `\nדיווחי שיעור השבוע: ${behaviorSummary}`;
    }

    if (attendance && attendance.length > 0) {
      const presentDays = attendance.filter(a => a.is_present).length;
      const absentDays = attendance.filter(a => !a.is_present);
      dataContext += `\nנוכחות: ${presentDays} ימי נוכחות`;
      if (absentDays.length > 0) {
        const reasons = absentDays.map(a => a.absence_reason || "לא צוין").join(", ");
        dataContext += `, ${absentDays.length} ימי היעדרות (${reasons})`;
      }
    }

    if (supportSessions && supportSessions.length > 0) {
      const types = supportSessions.flatMap(s => s.support_types || []);
      const uniqueTypes = [...new Set(types)];
      dataContext += `\nמפגשי תמיכה: ${supportSessions.length} מפגשים (${uniqueTypes.join(", ")})`;
    }

    const systemPrompt = `אתה מחנך בכיר בבית ספר טיפולי-חינוכי. תפקידך לקחת סיכום שבועי שנכתב על ידי מחנכת ולהעשיר אותו בהמלצות פרקטיות להורים.

כללים:
- שמור על הסיכום המקורי של המחנכת כלשונו בתחילת הטקסט
- הוסף מקטע "המלצות להורים לשבוע הבא:" עם 3-4 המלצות פרקטיות
- ההמלצות צריכות להתבסס על הנתונים מהשבוע (דיווחי שיעור, נוכחות, מפגשי תמיכה)
- המלצות קונקרטיות שהורה יכול לבצע בבית (משחקים, שיחות, שגרות, תרגול)
- שפה חמה, מכבדת ומעודדת
- אל תשתמש בכוכביות (*) או סימני מרקדאון
- מספר כל המלצה
- אם אין מספיק נתונים, תן המלצות כלליות מבוססות על הסיכום`;

    const userPrompt = `הסיכום השבועי של המחנכת על ${studentName}:
"${summaryText}"
${dataContext ? `\nנתונים מהשבוע:${dataContext}` : ""}

העשר את הסיכום בהמלצות פרקטיות להורים.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד רגע" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום עבור שירות ה-AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const enrichedSummary = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ enrichedSummary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-weekly-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
