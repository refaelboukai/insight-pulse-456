import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, className, reports, attendance, events } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `אתה מחנך בבית ספר. כתוב סיכום מקצועי ומפורט בעברית עבור התלמיד/ה ${studentName} מכיתה ${className || "לא ידוע"}.

הנה כל המידע שנאסף:

## נוכחות יומית:
${JSON.stringify(attendance, null, 2)}

## דיווחי שיעור:
${JSON.stringify(reports, null, 2)}

## אירועים חריגים:
${JSON.stringify(events, null, 2)}

כתוב סיכום מילולי מסודר הכולל:
1. סקירה כללית של התלמיד/ה
2. נוכחות — ימי חיסור עם תאריכים וסיבות
3. התנהגות — דפוסים, אירועים בולטים עם תאריכים
4. השתתפות ותפקוד לימודי
5. אירועים חריגים אם יש
6. המלצות לצוות החינוכי

חשוב: ציין תאריכים מדויקים לכל אירוע. כתוב בצורה מקצועית ותמציתית.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה יועץ חינוכי מקצועי. כתוב סיכומים מקצועיים בעברית. השתמש בתאריכים מדויקים." },
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
