import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { evaluation, studentName, subject } = await req.json();
    
    if (!evaluation || typeof evaluation !== "string" || evaluation.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid evaluation text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `אתה מחנך מקצועי בבית ספר טיפולי-חינוכי.
תפקידך לשפר ניסוח של הערכות מילוליות לתלמידים.

כללים:
- שמור על המשמעות המקורית של ההערכה
- נסח בצורה מקצועית, חינוכית-טיפולית וערכית
- השתמש בשפה חיובית ומחזקת
- הדגש חוזקות ונקודות אור
- אם יש קשיים - נסח אותם כאתגרים עם כיוון צמיחה
- כתוב בעברית תקנית ומקצועית
- אל תוסיף מידע שלא היה בהערכה המקורית
- החזר רק את הטקסט המשופר, ללא הסברים נוספים
- חשוב מאוד: אל תשתמש בכוכביות (*), סימני מרקדאון, או עיצוב מיוחד. החזר טקסט חלק ונקי בלבד, בפסקאות רגילות`;

    const userPrompt = `שפר את הניסוח של ההערכה המילולית הבאה${studentName ? ` עבור ${studentName}` : ''}${subject ? ` במקצוע ${subject}` : ''}:

"${evaluation}"`;

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש תשלום עבור שירות ה-AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ enhanced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rephrase error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
