import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, studentCode, className, grade, period, reports, attendance, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const periodLabel = period || 'כל התקופה';
    const totalDays = attendance.length;
    const absentDays = attendance.filter((a: any) => !a.present).length;
    const presentDays = totalDays - absentDays;

    const prompt = `הפק סיכום תפקוד קצר ומובנה בעברית עבור תלמיד/ה. התקופה: *${periodLabel}*. השתמש בפורמט הקבוע הבא בלבד:

---

*סיכום תפקוד תלמיד/ה*

*שם:* ${studentName}
*ת.ז:* ${studentCode}
*שכבה:* ${grade || "לא ידוע"}
*כיתה:* ${className || "לא ידוע"}

*תפקוד בבית הספר:*
[סכם בקצרה את התפקוד הלימודי וההתנהגותי על סמך דיווחי השיעור. ציין מגמות בולטות, מקצועות, רמת השתתפות, והתנהגויות חוזרות עם תאריכים. אל תפרש — רק עובדות.]

*נוכחות:*
נוכחות: ${presentDays}/${totalDays} ימים
חיסורים: ${absentDays} ימים
[פרט ימי חיסור עם תאריכים וסיבות]

*אירועים חריגים:*
[רק אם יש אירועים חריגים — ציין תאריך, סוג ותיאור קצר. אם אין — כתוב "לא דווחו אירועים חריגים"]

*המלצות להמשך:*
[2-4 צעדים מעשיים וקונקרטיים לתכנית עבודה. ללא פרשנויות אישיות.]

---

הנתונים:

דיווחי שיעור:
${JSON.stringify(reports, null, 2)}

נוכחות יומית:
${JSON.stringify(attendance, null, 2)}

אירועים חריגים:
${JSON.stringify(events, null, 2)}

חשוב: הסתמך אך ורק על הנתונים. אל תמציא. אל תוסיף הערכות סובייקטיביות. שמור על הפורמט המדויק.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה מפיק סיכומי תפקוד קצרים ומובנים לתלמידים. כתוב בצורה עובדתית בלבד, בפורמט קבוע. השתמש בכוכביות (*) לסימון כותרות כי הטקסט ישלח בוואטסאפ." },
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
    const summary = data.choices?.[0]?.message?.content || "לא ניתן לייצר סיכום";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("student-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
