import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, dominant, averages, challenges, staffNotes, gender } = await req.json();

    if (!studentName || !averages) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryLabels: Record<string, string> = {
      sensory: "חושי",
      movement: "תנועתי",
      social: "חברתי",
      emotional: "רגשי",
      structure: "מובנה/מסודר",
      creative: "יצירתי",
    };

    const profileDescription = Object.entries(averages)
      .map(([cat, avg]) => `${categoryLabels[cat] || cat}: ${avg}/5`)
      .join(", ");

    const dominantStr = (dominant || []).map((d: string) => categoryLabels[d] || d).join(", ");
    const challengesStr = (challenges || []).length > 0 ? `\nסתירות שזוהו: ${challenges.join("; ")}` : "";
    const notesStr = staffNotes ? `\nהערות צוות: ${staffNotes}` : "";
    const genderHe = gender === "female" ? "תלמידה" : "תלמיד";

    const systemPrompt = `אתה יועץ פדגוגי מומחה בבית ספר טיפולי-חינוכי. תפקידך לתת המלצות הוראה פרקטיות ומותאמות אישית למורים, בהתבסס על פרופיל סגנון הלמידה של ${genderHe}.

כללים:
- תן 5-7 המלצות ספציפיות ופרקטיות שהמורה יכול ליישם מיד
- התאם את ההמלצות לסגנונות הדומיננטיים של ${genderHe}
- כלול שיטות הוראה, סוגי משימות, ודרכי הערכה מותאמות
- אם יש סתירות בפרופיל, התייחס אליהן והצע דרכי גישור
- כתוב בעברית ברורה ומקצועית
- אל תשתמש בכוכביות (*) או סימני מרקדאון
- מספר כל המלצה (1. 2. 3. וכו')
- החזר רק את ההמלצות, ללא כותרת או הקדמה`;

    const userPrompt = `צור המלצות הוראה מותאמות אישית עבור ${studentName}:

פרופיל סגנון למידה: ${profileDescription}
סגנונות דומיננטיים: ${dominantStr || "לא זוהו"}${challengesStr}${notesStr}`;

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
    const recommendations = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("learning-style-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
