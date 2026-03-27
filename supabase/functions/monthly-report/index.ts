import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentId } = await req.json(); // null = all students
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const fromDate = monthAgo.toISOString().split("T")[0];

    // Fetch students
    let studentsQuery = supabase.from("students").select("*").eq("is_active", true).order("class_name").order("last_name");
    if (studentId) studentsQuery = studentsQuery.eq("id", studentId);
    const { data: students } = await studentsQuery;
    if (!students || students.length === 0) throw new Error("No students found");

    // Fetch all data for the month
    let reportsQuery = supabase.from("lesson_reports").select("*").gte("report_date", fromDate);
    let attendanceQuery = supabase.from("daily_attendance").select("*").gte("attendance_date", fromDate);
    let eventsQuery = supabase.from("exceptional_events").select("*").gte("created_at", fromDate);
    let supportQuery = supabase.from("support_sessions").select("*").gte("session_date", fromDate);

    if (studentId) {
      reportsQuery = reportsQuery.eq("student_id", studentId);
      attendanceQuery = attendanceQuery.eq("student_id", studentId);
    }

    const [reportsRes, attendanceRes, eventsRes, supportRes] = await Promise.all([
      reportsQuery, attendanceQuery, eventsQuery, supportQuery,
    ]);

    const behaviorLabels: Record<string, string> = { respectful: "מכבד", non_respectful: "לא מכבד", disruptive: "מפריע", violent: "אלים" };
    const attendanceLabels: Record<string, string> = { full: "נוכח מלא", partial: "נוכח חלקית", absent: "חסר" };
    const participationLabels: Record<string, string> = { completed_tasks: "ביצע משימות", active_participation: "השתתפות פעילה", no_participation: "לא השתתף", no_function: "לא תפקד" };
    const supportLabels: Record<string, string> = { social: "חברתית", emotional: "רגשית", academic: "לימודית", behavioral: "התנהגותית" };
    const absenceLabels: Record<string, string> = { illness: "מחלה", vacation: "חופשה", family_arrangements: "סידורים משפחתיים", medical_checkup: "בדיקה רפואית", emotional_difficulty: "קושי רגשי", school_suspension: "השעיה", other: "אחר" };

    // Build summary per student
    const studentSummaries = students.map((s: any) => {
      const sReports = (reportsRes.data || []).filter((r: any) => r.student_id === s.id);
      const sAttendance = (attendanceRes.data || []).filter((a: any) => a.student_id === s.id);
      const sSupport = (supportRes.data || []).filter((ss: any) => ss.student_id === s.id);
      const absent = sAttendance.filter((a: any) => !a.is_present);

      return {
        name: `${s.first_name} ${s.last_name}`,
        class: s.class_name,
        grade: s.grade,
        attendance: `${sAttendance.length - absent.length}/${sAttendance.length} ימי נוכחות`,
        absences: absent.map((a: any) => `${a.attendance_date}: ${a.absence_reason ? absenceLabels[a.absence_reason] || a.absence_reason : "לא צוינה סיבה"}`),
        behaviors: sReports.flatMap((r: any) => (r.behavior_types || []).map((b: string) => `${r.report_date}: ${behaviorLabels[b] || b}`)),
        participation: sReports.filter((r: any) => r.participation).map((r: any) => `${r.report_date} (${r.lesson_subject}): ${participationLabels[r.participation] || r.participation}`),
        support: sSupport.map((ss: any) => `${ss.session_date}: ${ss.provider_name} - ${(ss.support_types || []).map((t: string) => supportLabels[t] || t).join(", ")}`),
      };
    });

    const isAll = !studentId;
    const prompt = isAll
      ? `הפק דוח חודשי תפקודי מסכם בעברית עבור כלל התלמידים בחודש האחרון (מ-${fromDate}).

הנתונים:
${JSON.stringify(studentSummaries, null, 2)}

כתוב דוח מובנה הכולל:
1. *סיכום כללי* — מספר תלמידים, מגמות כלליות בנוכחות והתנהגות
2. *תלמידים שדורשים תשומת לב* — ציין תלמידים עם חיסורים מרובים, התנהגות בעייתית חוזרת, או חוסר תפקוד
3. *נוכחות* — סטטיסטיקה כללית ותלמידים בולטים לשלילה
4. *התנהגות* — מגמות כלליות ואירועים בולטים
5. *תמיכות שניתנו* — סיכום מפגשי תמיכה שנרשמו
6. *המלצות לתכנית עבודה* — צעדים מעשיים להמשך

חשוב: ללא פרשנויות אישיות, רק עובדות והמלצות מעשיות.`
      : `הפק דוח חודשי תפקודי מסכם בעברית עבור התלמיד/ה בחודש האחרון (מ-${fromDate}).

הנתונים:
${JSON.stringify(studentSummaries[0], null, 2)}

כתוב דוח מובנה הכולל:
1. *פרטי התלמיד/ה* — שם, ת.ז, שכבה, כיתה
2. *תפקוד בבית הספר* — השתתפות, התנהגות ומגמות עם תאריכים
3. *נוכחות* — ימי נוכחות, חיסורים עם תאריכים וסיבות
4. *תמיכות שניתנו* — מפגשים שנרשמו עם פרטים
5. *המלצות לתכנית עבודה* — צעדים קונקרטיים

חשוב: ללא פרשנויות אישיות, רק עובדות והמלצות מעשיות.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה כותב דוחות תפקוד חודשיים מקצועיים לבית ספר. כתוב בצורה עובדתית, תמציתית ומבוססת נתונים. השתמש בכוכביות (*) לכותרות כי הטקסט ישלח בוואטסאפ." },
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
    const summary = data.choices?.[0]?.message?.content || "לא ניתן לייצר דוח";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("monthly-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
