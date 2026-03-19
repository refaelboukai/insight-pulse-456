import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, studentCode, className, grade, reports, attendance, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `כתוב סיכום תפקוד מקצועי בעברית עבור התלמיד/ה הבא/ה:

שם: ${studentName}
תעודת זהות: ${studentCode}
שכבה: ${grade || "לא ידוע"}
כיתה: ${className || "לא ידוע"}

## נתוני נוכחות יומית:
${JSON.stringify(attendance, null, 2)}

## דיווחי שיעור:
${JSON.stringify(reports, null, 2)}

## אירועים חריגים:
${JSON.stringify(events, null, 2)}

כתוב את הסיכום במבנה הבא בדיוק:

1. **פרטי התלמיד/ה** — שם מלא, תעודת זהות, שכבה וכיתה.

2. **תפקוד לימודי** — סיכום ההשתתפות בשיעורים, רמת המעורבות, ציוני ביצועים אם יש, מקצועות בולטים לחיוב ולשלילה. ציין תאריכים מדויקים.

3. **תפקוד התנהגותי** — דפוסי התנהגות שנצפו, רמות חומרה, התנהגויות חוזרות. ציין תאריכים מדויקים לכל אירוע.

4. **תפקוד נוכחות** — סיכום ימי נוכחות, חיסורים ואיחורים עם תאריכים מדויקים וסיבות.

5. **אירועים חריגים** — רק אם יש, ציין את האירועים עם תאריכים, סוג האירוע והמעורבים.

6. **המלצות לתכנית עבודה** — צעדים קונקרטיים להמשך: התערבויות מומלצות, שיחות נדרשות, תוכניות תמיכה, יעדים מדידים. אל תוסיף פרשנויות אישיות — רק צעדים מעשיים מבוססי נתונים.

חשוב: הסתמך אך ורק על הנתונים שסופקו. אל תמציא מידע. אל תוסיף הערכות סובייקטיביות על אישיות התלמיד/ה.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה כותב סיכומי תפקוד מקצועיים לתלמידים בבית ספר. כתוב בצורה עובדתית, תמציתית ומבוססת נתונים בלבד. אל תוסיף פרשנויות אישיות. התמקד בעובדות ובהמלצות מעשיות לתכנית עבודה." },
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
