import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, reports } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!reports || reports.length === 0) {
      return new Response(JSON.stringify({ summary: "אין דיווחים להיום, אז אין מה לסכם. מחר יום חדש! 🌟" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `את מחנכת כיתה. כתבי סיכום יום אישי וחם עבור ${studentName}, בדיוק 2-3 משפטים.

הנתונים מהיום:
${JSON.stringify(reports, null, 2)}

הנחיות:
1. כתבי כמחנכת — בגוף ראשון ("ראיתי", "שמתי לב", "גאה בך").
2. התייחסי לתמונה היומית השלמה — אינטגרציה של כל השיעורים יחד, לא פירוט שיעור אחר שיעור.
3. הדגישי חוזקות והצלחות.
4. אם היתה התנהגות שלילית: ציני בקצרה, הביעי אמונה ביכולת, והפני לחשיבה ("בפעם הבאה אפשר לנסות...").
5. סיימי עם מבט קדימה — מה אפשר לשפר או להמשיך לעשות טוב מחר.
6. בלי אימוג'ים, בלי כוכביות, בלי כותרות. טקסט פשוט בלבד, 2-3 משפטים.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה יועץ חינוכי חם שכותב סיכומי יום מחזקים לתלמידים. כתוב בעברית טבעית, חמה ואישית." },
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
    console.error("student-daily-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
