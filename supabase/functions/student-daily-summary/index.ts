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
      return new Response(JSON.stringify({ summary: "אין דיווחים להיום." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `סכם את הדיווחים של ${studentName} מהיום בצורה עובדתית בלבד.

הנתונים:
${JSON.stringify(reports, null, 2)}

הנחיות:
1. סכם את העובדות בלבד — מה דווח בכל שיעור: נוכחות, התנהגות, למידה, והערות אם יש.
2. אל תוסיף פרשנויות, עידוד, ביקורת, או המלצות.
3. אל תוסיף אימוג'ים, כוכביות, או כותרות.
4. כתוב בגוף שלישי ("בשיעור מתמטיקה נרשמה נוכחות מלאה...").
5. 2-4 משפטים קצרים. טקסט פשוט בלבד.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "אתה מערכת סיכום עובדתית. תפקידך לסכם דיווחים בית ספריים בצורה ניטרלית ומדויקת, בלי להוסיף פרשנות או רגש. כתוב בעברית." },
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
