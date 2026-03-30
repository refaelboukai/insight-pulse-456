import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type EmotionState = 'angry' | 'anxious' | 'happy';

interface BrainRegion {
  id: string;
  name: string;
  hebrewName: string;
  emoji: string;
  description: string;
  states: Record<EmotionState, string>;
  position: { cx: number; cy: number; rx: number; ry: number };
  color: string;
  activeColor: string;
}

const brainRegions: BrainRegion[] = [
  {
    id: 'prefrontal',
    name: 'Prefrontal Cortex',
    hebrewName: 'קורטקס קדם-מצחי',
    emoji: '🧩',
    description: 'האזור שאחראי על חשיבה, תכנון, קבלת החלטות ושליטה עצמית. הוא ה"מנהל" של המוח.',
    states: {
      angry: 'כשכועסים – האזור הזה "נכבה" חלקית. לכן קשה לחשוב בבהירות ואנחנו עלולים להגיב בלי לחשוב. נשימות עמוקות עוזרות "להדליק" אותו מחדש.',
      anxious: 'כשחרדים – האזור הזה עובד יותר מדי, מנסה לחזות סכנות שאולי לא קיימות. זה גורם למחשבות חוזרות ודאגות. קרקוע דרך החושים עוזר להרגיע אותו.',
      happy: 'כששמחים – האזור הזה פועל ביעילות! אנחנו חושבים טוב יותר, יצירתיים יותר, ומקבלים החלטות טובות יותר. שמחה ממש עוזרת למוח לעבוד.'
    },
    position: { cx: 150, cy: 75, rx: 42, ry: 28 },
    color: 'hsl(210, 60%, 45%)',
    activeColor: 'hsl(210, 80%, 55%)',
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    hebrewName: 'אמיגדלה',
    emoji: '🚨',
    description: 'מרכז הרגשות והאזעקה של המוח. היא מזהה סכנות ומפעילה תגובות רגשיות מהירות.',
    states: {
      angry: 'כשכועסים – האמיגדלה "בוערת"! היא שולחת אזעקה לכל הגוף: הלב מאיץ, השרירים מתכווצים, הפנים מתחממות. היא רוצה שנילחם או נברח.',
      anxious: 'כשחרדים – האמיגדלה רגישה מדי ומזהה "סכנות" גם כשאין סכנה אמיתית. היא שולחת אותות פחד שגורמים לתחושות גופניות לא נעימות.',
      happy: 'כששמחים – האמיגדלה רגועה ושקטה. היא לא שולחת אזעקות, ולכן הגוף מרגיש רגוע ובטוח. זה מאפשר ליהנות מהרגע.'
    },
    position: { cx: 190, cy: 158, rx: 20, ry: 16 },
    color: 'hsl(0, 70%, 55%)',
    activeColor: 'hsl(0, 85%, 60%)',
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    hebrewName: 'היפוקמפוס',
    emoji: '📚',
    description: 'מרכז הזיכרון והלמידה. הוא שומר זכרונות ועוזר לנו ללמוד מניסיון העבר.',
    states: {
      angry: 'כשכועסים – ההיפוקמפוס מושפע ויכול "לשלוף" זכרונות שליליים מהעבר, מה שמגביר את הכעס. לכן כשכועסים אנחנו נזכרים בכל הפעמים שפגעו בנו.',
      anxious: 'כשחרדים – ההיפוקמפוס מזכיר לנו מצבים מפחידים מהעבר, גם כאלה שכבר עברו. זה יכול לגרום לדאגות על דברים שסביר שלא יקרו.',
      happy: 'כששמחים – ההיפוקמפוס עובד מצוין! אנחנו לומדים טוב יותר, זוכרים טוב יותר, ויוצרים זכרונות חיוביים שילוו אותנו.'
    },
    position: { cx: 215, cy: 185, rx: 26, ry: 14 },
    color: 'hsl(142, 50%, 40%)',
    activeColor: 'hsl(142, 65%, 50%)',
  },
];

const emotionButtons: { id: EmotionState; label: string; emoji: string; bgClass: string; activeClass: string }[] = [
  { id: 'angry', label: 'כועס', emoji: '😡', bgClass: 'bg-destructive/10 border-destructive/20', activeClass: 'bg-destructive/20 border-destructive/40 ring-2 ring-destructive/30' },
  { id: 'anxious', label: 'חרד', emoji: '😰', bgClass: 'bg-warning/10 border-warning/20', activeClass: 'bg-warning/20 border-warning/40 ring-2 ring-warning/30' },
  { id: 'happy', label: 'שמח', emoji: '😊', bgClass: 'bg-sage border-sage-text/20', activeClass: 'bg-sage border-sage-text/40 ring-2 ring-sage-text/30' },
];

export default function InteractiveBrainMap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionState>('angry');

  const activeRegion = brainRegions.find(r => r.id === selectedRegion);

  return (
    <div className="space-y-4 mt-2">
      {/* Emotion selector */}
      <div className="text-center">
        <p className="text-[12px] text-muted-foreground mb-2">בחר מצב רגשי כדי לראות מה קורה במוח:</p>
        <div className="flex justify-center gap-2">
          {emotionButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => { setSelectedEmotion(btn.id); setSelectedRegion(null); }}
              className={`rounded-xl px-3 py-2 text-[12px] font-medium border transition-all ${
                selectedEmotion === btn.id ? btn.activeClass : btn.bgClass
              }`}
            >
              <span className="text-base ml-1">{btn.emoji}</span>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brain SVG */}
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 360 300"
          className="w-full max-w-[320px] h-auto"
          style={{ direction: 'ltr' }}
        >
          <defs>
            <radialGradient id="brainGrad" cx="48%" cy="40%" r="52%">
              <stop offset="0%" stopColor="hsl(330, 25%, 92%)" />
              <stop offset="50%" stopColor="hsl(340, 20%, 85%)" />
              <stop offset="100%" stopColor="hsl(350, 18%, 78%)" />
            </radialGradient>
            <radialGradient id="brainInner" cx="45%" cy="38%" r="45%">
              <stop offset="0%" stopColor="hsl(330, 30%, 90%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(340, 20%, 82%)" stopOpacity="0.2" />
            </radialGradient>
            <filter id="brainShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="hsl(340, 20%, 60%)" floodOpacity="0.15" />
            </filter>
            {brainRegions.map(region => (
              <radialGradient key={`grad-${region.id}`} id={`grad-${region.id}`} cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor={selectedRegion === region.id ? region.activeColor : region.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={selectedRegion === region.id ? region.activeColor : region.color} stopOpacity="0.35" />
              </radialGradient>
            ))}
          </defs>

          {/* Brain side-profile — anatomically accurate shape */}
          {/* Cerebrum — large upper mass with realistic bumps (gyri) */}
          <path
            d="M85,155
               C75,140 68,118 70,98
               C72,78 82,60 98,48
               C114,36 132,30 152,28
               C172,26 195,27 215,32
               C235,37 252,46 264,60
               C276,74 284,92 286,112
               C288,125 286,138 280,150
               C274,162 265,172 254,180
               C248,185 242,188 235,192
               L230,195
               C222,200 212,204 200,207
               C188,210 175,210 162,208
               C148,205 135,200 124,192
               C113,184 103,174 95,163
               C90,158 87,156 85,155 Z"
            fill="url(#brainGrad)"
            stroke="hsl(340, 18%, 72%)"
            strokeWidth="1.2"
            filter="url(#brainShadow)"
          />

          {/* Temporal lobe — lower bulge */}
          <path
            d="M108,175
               C115,185 128,195 145,200
               C155,203 165,205 175,205
               C185,205 195,203 205,200
               C215,195 225,188 232,178
               C238,170 240,162 238,155
               C236,148 230,142 222,138
               C218,136 212,138 208,142
               C200,150 188,158 172,162
               C156,166 140,164 128,158
               C118,152 112,148 108,145
               C104,150 105,165 108,175 Z"
            fill="url(#brainInner)"
            stroke="hsl(340, 18%, 75%)"
            strokeWidth="0.8"
          />

          {/* Cerebellum — small bumpy structure at back-bottom */}
          <path
            d="M230,195
               C240,200 252,208 258,218
               C264,228 262,240 255,248
               C248,256 238,258 228,256
               C218,254 210,248 208,240
               C206,232 210,222 218,214
               C222,208 226,200 230,195 Z"
            fill="hsl(340, 15%, 82%)"
            stroke="hsl(340, 18%, 72%)"
            strokeWidth="1"
          />
          {/* Cerebellum lines */}
          <path d="M235,210 C242,218 245,228 242,238" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.7" />
          <path d="M228,215 C233,225 234,235 230,245" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.7" />
          <path d="M222,220 C225,228 225,238 222,248" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.7" />

          {/* Brain stem */}
          <path
            d="M208,240
               C210,250 212,262 210,275
               C209,280 205,283 200,284
               C195,283 192,280 191,275
               C189,262 192,250 195,240
               C198,238 204,238 208,240 Z"
            fill="hsl(340, 12%, 80%)"
            stroke="hsl(340, 18%, 70%)"
            strokeWidth="1"
          />

          {/* Sulci / fissures — brain wrinkle lines */}
          <path d="M130,55 C150,48 175,46 200,50" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M110,75 C135,65 168,60 205,65 C225,68 245,74 260,82" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M95,100 C120,88 155,82 195,85 C225,88 255,98 275,112" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M88,128 C110,118 145,110 185,112 C215,114 248,125 272,140" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M100,150 C120,142 150,136 185,138 C210,140 235,148 255,160" fill="none" stroke="hsl(340, 15%, 72%)" strokeWidth="0.7" strokeLinecap="round" />
          
          {/* Lateral fissure (Sylvian fissure) — prominent diagonal line */}
          <path d="M115,155 C140,142 170,135 210,140" fill="none" stroke="hsl(340, 18%, 68%)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Clickable regions */}
          {brainRegions.map(region => {
            const isActive = selectedRegion === region.id;
            return (
              <g key={region.id} className="cursor-pointer" onClick={() => setSelectedRegion(isActive ? null : region.id)}>
                <ellipse
                  cx={region.position.cx}
                  cy={region.position.cy}
                  rx={region.position.rx + (isActive ? 4 : 0)}
                  ry={region.position.ry + (isActive ? 3 : 0)}
                  fill={`url(#grad-${region.id})`}
                  stroke={isActive ? region.activeColor : region.color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {isActive && (
                  <ellipse
                    cx={region.position.cx}
                    cy={region.position.cy}
                    rx={region.position.rx + 8}
                    ry={region.position.ry + 6}
                    fill="none"
                    stroke={region.activeColor}
                    strokeWidth="1"
                    opacity="0.4"
                  >
                    <animate attributeName="rx" values={`${region.position.rx + 6};${region.position.rx + 12};${region.position.rx + 6}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="ry" values={`${region.position.ry + 4};${region.position.ry + 9};${region.position.ry + 4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </ellipse>
                )}
                <text
                  x={region.position.cx}
                  y={region.position.cy + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="16"
                  style={{ pointerEvents: 'none' }}
                >
                  {region.emoji}
                </text>
              </g>
            );
          })}

          {/* Labels */}
          {brainRegions.map(region => {
            const labelPositions: Record<string, { x: number; y: number }> = {
              prefrontal: { x: 95, y: 48 },
              amygdala: { x: 130, y: 170 },
              hippocampus: { x: 270, y: 200 },
            };
            const pos = labelPositions[region.id];
            return (
              <g key={`label-${region.id}`}>
                <line
                  x1={region.position.cx}
                  y1={region.position.cy}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="hsl(210, 15%, 75%)"
                  strokeWidth="0.8"
                  strokeDasharray="3,2"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={selectedRegion === region.id ? region.activeColor : 'hsl(215, 15%, 50%)'}
                  style={{ transition: 'fill 0.3s', direction: 'rtl' }}
                >
                  {region.hebrewName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">👆 לחץ על אזור במוח כדי ללמוד עליו</p>

      {/* Info panel */}
      <AnimatePresence mode="wait">
        {activeRegion && (
          <motion.div
            key={activeRegion.id + selectedEmotion}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm relative"
          >
            <button
              onClick={() => setSelectedRegion(null)}
              className="absolute top-3 left-3 w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X size={12} className="text-muted-foreground" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{activeRegion.emoji}</span>
              <div>
                <h4 className="text-[14px] font-bold text-foreground">{activeRegion.hebrewName}</h4>
                <p className="text-[10px] text-muted-foreground">{activeRegion.name}</p>
              </div>
            </div>

            <p className="text-[12px] text-foreground/70 mb-3 leading-relaxed">
              {activeRegion.description}
            </p>

            <div className="rounded-xl bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">
                  {selectedEmotion === 'angry' ? '😡' : selectedEmotion === 'anxious' ? '😰' : '😊'}
                </span>
                <span className="text-[12px] font-bold text-foreground">
                  {selectedEmotion === 'angry' ? 'כשאני כועס/ת:' : selectedEmotion === 'anxious' ? 'כשאני חרד/ה:' : 'כשאני שמח/ה:'}
                </span>
              </div>
              <p className="text-[12px] text-foreground/70 leading-relaxed">
                {activeRegion.states[selectedEmotion]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
