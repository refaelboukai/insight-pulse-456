import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, fieldType } = await req.json();
    
    if (!text || typeof text !== "string" || text.length > 3000) {
      return new Response(JSON.stringify({ error: "טקסט לא תקין" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const fieldLabels: Record<string, string> = {
      description: "תיאור אירוע חריג",
      staffResponse: "תגובת צוות",
      followupNotes: "הערות מעקב",
    };

    const label = fieldLabels[fieldType] || "טקסט";

    const systemPrompt = `אתה עורך טקסט מקצועי בבית ספר טיפולי-חינוכי.
תפקידך לשפר את העיצוב והקריאות של טקסט מסוג "${label}" - בלי לשנות את התוכן עצמו.

כללים חשובים:
- אל תשנה את התוכן, את המשמעות, או את המילים
- שפר רק את: הרווחים, שבירת השורות, הפסקאות, ופיסוק
- הוסף שורות ריקות בין פסקאות לקריאות טובה יותר
- תקן שגיאות כתיב ופיסוק בסיסיות בלבד
- אל תוסיף מידע חדש
- אל תשתמש בכוכביות, מרקדאון, או עיצוב מיוחד
- החזר טקסט חלק ונקי בפסקאות רגילות בלבד`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `שפר את עיצוב הטקסט הבא:\n\n"${text}"` },
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
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const formatted = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ formatted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("format error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
