import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserCheck, ChevronDown, Brain, Lightbulb, Heart, Zap, AlertTriangle, RotateCcw, Sparkles, Map, Star } from 'lucide-react';
import InteractiveBrainMap from '@reset/components/InteractiveBrainMap';

const topCards = [
  { title: 'איך רגשות עובדים', content: 'רגשות הם אותות מהגוף שעוזרים לנו להבין מה חשוב לנו. הם לא טובים או רעים – הם מידע.', icon: '🧠' },
  { title: 'למה לפעמים קשה להירגע', content: 'כשהמוח מזהה סכנה (אמיתית או מדומיינת), הוא מפעיל תגובת לחימה-בריחה. זה תקין – אבל אפשר ללמד אותו להירגע.', icon: '💭' },
  { title: 'איך עצירה קצרה משנה תגובה', content: 'כשעוצרים לרגע, אנחנו נותנים למוח הרציונלי לעבוד. זה ההבדל בין תגובה אוטומטית לבחירה מודעת.', icon: '⏸️' },
  { title: 'איך להתמודד עם ריב', content: 'לנשום, להקשיב, לנסות להבין את הצד השני. לבקש הפסקה אם צריך. לחזור לשיחה כשרגועים יותר.', icon: '🤝' },
  { title: 'איך להירגע מהר', content: '3 דברים: נשימות עמוקות, קרקוע דרך החושים, והזזת הגוף. גם דקה אחת עוזרת.', icon: '🌊' },
];

const chemicals = [
  {
    name: 'דופמין',
    icon: <Zap size={18} />,
    emoji: '⚡',
    what: 'קשור למוטיבציה, עניין ותחושת סיפוק.',
    cause: 'הצלחה, סיום משימה, למידה חדשה, יצירה.',
    action: 'להשלים משימה קטנה, להציב יעד קטן, לעשות משהו מהנה.',
    feel: 'יותר מוטיבציה, עניין, סיפוק ואנרגיה לפעול.',
  },
  {
    name: 'סרוטונין',
    icon: <Heart size={18} />,
    emoji: '💛',
    what: 'קשור לרוגע, יציבות ותחושת ביטחון.',
    cause: 'אור שמש, פעילות גופנית, שינה טובה, קשר עם אנשים.',
    action: 'לצאת לאור, לזוז קצת, לדבר עם מישהו קרוב.',
    feel: 'יותר רוגע, יציבות וביטחון.',
  },
  {
    name: 'אוקסיטוצין',
    icon: <Brain size={18} />,
    emoji: '🤗',
    what: 'קשור לקרבה, אמון ושייכות.',
    cause: 'שיחה נעימה, חיבוק, עזרה למישהו, קשר קרוב.',
    action: 'לדבר עם חבר, לבקש או לתת חיבוק, לשתף.',
    feel: 'פחות בדידות, יותר קרבה ושייכות.',
  },
  {
    name: 'אנדורפינים',
    icon: <Lightbulb size={18} />,
    emoji: '🏃',
    what: 'קשורים להפחתת כאב ולשיפור מצב רוח.',
    cause: 'פעילות גופנית, צחוק, מוזיקה, תנועה.',
    action: 'ללכת, לרקוד, לצחוק, לשמוע מוזיקה.',
    feel: 'יותר הקלה, יותר אנרגיה, פחות מתח.',
  },
];

const stressResponse = [
  { phase: 'זיהוי איום', icon: '👀', hormone: 'אדרנלין', body: 'הלב מאיץ, השרירים מתכווצים, הנשימה מהירה', tip: 'הגוף מתכונן לפעולה – זה תקין!' },
  { phase: 'שיא הלחץ', icon: '⚡', hormone: 'קורטיזול', body: 'קשה לחשוב בבהירות, ידיים רועדות, בטן מתהפכת', tip: 'זה הרגע לעצור ולנשום – לא להגיב!' },
  { phase: 'ירידה', icon: '🌊', hormone: 'הגוף חוזר לאיזון', body: 'הדופק יורד, הנשימה נרגעת, השרירים משתחררים', tip: 'לתת לגוף לסיים את התהליך. שתייה, נשימות, תנועה עדינה.' },
];

const emotionCycle = [
  { stage: 'טריגר', emoji: '💥', desc: 'משהו קורה שמעורר רגש – מילה, מצב, זיכרון', color: 'bg-destructive/10 border-destructive/20' },
  { stage: 'עלייה', emoji: '📈', desc: 'הרגש מתחזק. הגוף מגיב – דופק עולה, מתח בגוף', color: 'bg-warning/10 border-warning/20' },
  { stage: 'שיא', emoji: '🔥', desc: 'הנקודה הכי חזקה. קשה לחשוב. הרצון לפעול גדול', color: 'bg-destructive/15 border-destructive/30' },
  { stage: 'ירידה', emoji: '📉', desc: 'הרגש מתחיל לרדת. הגוף נרגע בהדרגה', color: 'bg-primary/10 border-primary/20' },
  { stage: 'איזון', emoji: '☁️', desc: 'חזרה לשגרה. אפשר לחשוב, לדבר, לבחור תגובה', color: 'bg-sage border-sage-text/10' },
];

const quickTips = [
  { title: '3 דברים שעוזרים להירגע מהר', items: ['נשימות עמוקות – 4 שניות פנימה, 6 שניות החוצה', 'לגעת במשהו קר (מים, קרח)', 'להזיז את הגוף – הליכה, מתיחות'] },
  { title: 'איך לעצור ריב לפני שהוא מתפוצץ', items: ['לקחת צעד אחורה', 'לנשום פעמיים', 'להגיד: "אני צריך רגע"'] },
  { title: 'מה לעשות כשכועסים מאוד', items: ['לספור עד 10', 'להחזיק קרח ביד', 'ללכת למקום שקט לדקה'] },
];

const qualityOfLifeDimensions = [
  { name: 'יחסים בין-אישיים', emoji: '🤝', desc: 'איך אתם מסתדרים עם חברים, עם המשפחה ועם הצוות בבית הספר.' },
  { name: 'הכלה חברתית', emoji: '🏘️', desc: 'להרגיש חלק מהקבוצה, להשתתף בפעילויות בקהילה ולהרגיש שייכים.' },
  { name: 'הכוונה עצמית', emoji: '🧭', desc: 'היכולת שלכם להחליט החלטות בעצמכם, לקבוע מטרות ולבחור מה נכון לכם.' },
  { name: 'זכויות', emoji: '⚖️', desc: 'להרגיש שמכבדים אתכם, שיש לכם פרטיות ושאתם יודעים מה מגיע לכם.' },
  { name: 'התפתחות אישית', emoji: '📚', desc: 'ללמוד דברים חדשים, להשתפר במיומנויות ולגלות במה אתם טובים.' },
  { name: 'רווחה רגשית', emoji: '💚', desc: 'להרגיש בטוחים, שמחים ורגועים ביום-יום שלכם.' },
  { name: 'רווחה פיזית', emoji: '💪', desc: 'להיות בריאים, לאכול טוב, לעשות ספורט ולהצליח לבצע פעולות יומיומיות בקלות.' },
  { name: 'רווחה חומרית', emoji: '🎒', desc: 'להרגיש שיש לכם את מה שאתם צריכים (כמו ציוד, כסף לכיס ותנאים נוחים).' },
];

const planSteps = [
  { step: 'נשאל ונבין', emoji: '📝', desc: 'אתם, ההורים והמורים תמלאו שאלונים כדי שנראה איפה אתם מרגישים חזקים ואיפה פחות.' },
  { step: 'נשוחח', emoji: '💬', desc: 'נשב לשיחה אישית ("התוכנית השנתית שלי") שבה נדבר על החלומות שלכם ועל מה שהייתם רוצים לשנות.' },
  { step: 'נבחר מטרות', emoji: '🎯', desc: 'נחליט יחד על 1-2 דברים שחשוב לכם לקדם השנה.' },
  { step: 'נצא לדרך', emoji: '🚀', desc: 'נקבע דרכי פעולה כדי לעזור לכם להצליח (למשל: עזרה במקצוע מסוים, שיחות עם מחנך או פעילות חברתית).' },
];

type SectionId = 'brainmap' | 'basics' | 'chemicals' | 'stress' | 'cycle' | 'tips' | 'quality';

const sections: { id: SectionId; title: string; icon: React.ReactNode; subtitle: string }[] = [
  { id: 'brainmap', title: 'מפת המוח שלי', icon: <Map size={18} />, subtitle: 'לחץ על אזור במוח כדי להבין מה קורה שם' },
  { id: 'quality', title: 'איכות חיים', icon: <Star size={18} />, subtitle: '8 מדדים שמרכיבים את החיים שלכם' },
  { id: 'basics', title: 'איך רגשות עובדים?', icon: <Sparkles size={18} />, subtitle: '5 דברים חשובים שכדאי לדעת' },
  { id: 'chemicals', title: 'החומרים במוח', icon: <Brain size={18} />, subtitle: 'דופמין, סרוטונין, אוקסיטוצין ואנדורפינים' },
  { id: 'stress', title: 'מה קורה בגוף כשנלחצים?', icon: <AlertTriangle size={18} />, subtitle: '3 שלבים של תגובת הלחץ' },
  { id: 'cycle', title: 'מעגל הרגש', icon: <RotateCcw size={18} />, subtitle: 'כל רגש עובר מעגל ותמיד יורד' },
  { id: 'tips', title: 'טיפים מהירים', icon: <Lightbulb size={18} />, subtitle: 'כלים פרקטיים ליישום מיידי' },
];

export default function InfoTips() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [expandedChem, setExpandedChem] = useState<number | null>(null);

  const toggle = (id: SectionId) => {
    setOpenSection(openSection === id ? null : id);
    setExpandedCard(null);
    setExpandedChem(null);
  };

  return (
    <div className="screen-container">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
          <Brain size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">ידע = כוח</span>
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">מידע וטיפים</h2>
        <p className="text-lg text-muted-foreground mt-1">לחצו על נושא כדי לגלות עוד</p>
      </motion.div>

      {/* Accordion sections */}
      <div className="space-y-3 mb-8">
        {sections.map((section, si) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }}
            className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm"
          >
            {/* Section header */}
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center gap-3 p-4 text-right hover:bg-secondary/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-base text-foreground block">{section.title}</span>
                <span className="text-xs text-muted-foreground">{section.subtitle}</span>
              </div>
              <ChevronDown
                size={18}
                className={`text-muted-foreground transition-transform duration-300 shrink-0 ${openSection === section.id ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Section content */}
            <AnimatePresence>
              {openSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-border/40">

                    {/* === BRAIN MAP === */}
                    {section.id === 'brainmap' && (
                      <InteractiveBrainMap />
                    )}

                    {/* === QUALITY OF LIFE === */}
                    {section.id === 'quality' && (
                      <div className="mt-2 space-y-4">
                        {/* Intro */}
                        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            היי! 👋 איכות חיים היא לא רק ציון במבחן או כמה כסף יש לנו בכיס. היא ההרגשה הכללית שלכם – עד כמה אתם מרוצים מהחיים שלכם, מהקשרים שלכם ומהיכולת שלכם להשיג את מה שאתם רוצים.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            הגישה שלנו אומרת שלכל אחד מכם יש רצונות, אהבות ויכולות מיוחדות. המטרה שלנו היא לצמצם את הפער בין מה שקורה עכשיו לבין מה שהייתם רוצים שיקרה.
                          </p>
                        </div>

                        {/* 8 Dimensions */}
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-2">🌟 8 המדדים שמרכיבים את החיים שלכם:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {qualityOfLifeDimensions.map((dim, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-xl bg-secondary/40 border border-border/40 p-3 hover:bg-secondary/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{dim.emoji}</span>
                                   <span className="font-bold text-xs text-foreground">{dim.name}</span>
                                 </div>
                                 <p className="text-xs text-muted-foreground leading-relaxed">{dim.desc}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Plan Steps */}
                        <div>
                          <h4 className="text-sm font-bold text-foreground mb-2">🗺️ איך בונים את "התוכנית האישית" שלי?</h4>
                          <p className="text-xs text-muted-foreground mb-3">התוכנית היא לא משהו ש"נוחת עליכם" מלמעלה – היא נבנית יחד איתכם:</p>
                          <div className="relative">
                            <div className="absolute right-[18px] top-4 bottom-4 w-0.5 bg-primary/20 rounded-full" />
                            <div className="space-y-3">
                              {planSteps.map((ps, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex gap-3 relative"
                                >
                                  <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm shrink-0 z-10">
                                    {ps.emoji}
                                  </div>
                                  <div className="flex-1 rounded-xl bg-secondary/40 p-3">
                                     <span className="font-bold text-sm text-foreground">{ps.step}</span>
                                     <p className="text-xs text-foreground/70 mt-1">{ps.desc}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom message */}
                        <div className="rounded-xl p-3 bg-primary/5 border border-primary/15 text-center">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            🔑 <strong>זכרו:</strong> המטרה היא לתת לכם את התמיכה המדויקת שאתם צריכים כדי שתרגישו שאתם שולטים בחיים שלכם ומקדמים את עצמכם.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* === BASICS === */}
                    {section.id === 'basics' && (
                      <div className="space-y-2 mt-2">
                        {topCards.map((card, i) => (
                          <button
                            key={i}
                            onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                            className="w-full text-right rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{card.icon}</span>
                                <span className="font-semibold text-sm text-foreground">{card.title}</span>
                              </div>
                              <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expandedCard === i ? 'rotate-180' : ''}`} />
                            </div>
                            <AnimatePresence>
                              {expandedCard === i && (
                                <motion.p
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-sm text-muted-foreground mt-2 pr-7 leading-relaxed"
                                >
                                  {card.content}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* === CHEMICALS === */}
                    {section.id === 'chemicals' && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {chemicals.map((chem, i) => (
                          <button
                            key={chem.name}
                            onClick={() => setExpandedChem(expandedChem === i ? null : i)}
                            className={`text-right rounded-xl p-3 transition-all border ${expandedChem === i ? 'col-span-2 bg-primary/5 border-primary/20' : 'bg-secondary/30 border-transparent hover:bg-secondary/50'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{chem.emoji}</span>
                              <span className="font-bold text-sm text-foreground">{chem.name}</span>
                              <ChevronDown size={12} className={`text-muted-foreground mr-auto transition-transform ${expandedChem === i ? 'rotate-180' : ''}`} />
                            </div>
                            <AnimatePresence>
                              {expandedChem === i && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-1.5 mt-2"
                                >
                                   <p className="text-sm text-foreground/80"><strong>מה זה:</strong> {chem.what}</p>
                                   <p className="text-sm text-foreground/80"><strong>מה גורם להפרשה:</strong> {chem.cause}</p>
                                   <p className="text-sm text-foreground/80"><strong>מה אפשר לעשות:</strong> {chem.action}</p>
                                   <p className="text-sm text-primary/80"><strong>איך נרגיש:</strong> {chem.feel}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* === STRESS === */}
                    {section.id === 'stress' && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          כשאנחנו מרגישים לחץ או סכנה, הגוף עובר תהליך אוטומטי:
                        </p>
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute right-[18px] top-4 bottom-4 w-0.5 bg-warning/30 rounded-full" />
                          <div className="space-y-3">
                            {stressResponse.map((phase, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-3 relative"
                              >
                                <div className="w-9 h-9 rounded-full bg-warning/15 border-2 border-warning/40 flex items-center justify-center text-sm shrink-0 z-10">
                                  {phase.icon}
                                </div>
                                <div className="flex-1 rounded-xl bg-secondary/40 p-3">
                                  <div className="flex items-center gap-2 mb-1.5">
                                     <span className="font-bold text-sm text-foreground">שלב {i + 1}: {phase.phase}</span>
                                     <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{phase.hormone}</span>
                                   </div>
                                   <p className="text-sm text-foreground/70 mb-1">🫀 {phase.body}</p>
                                   <p className="text-sm text-primary/80">💡 {phase.tip}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* === EMOTION CYCLE === */}
                    {section.id === 'cycle' && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          כל רגש – גם הקשה ביותר – עובר מעגל ותמיד יורד בסוף.
                        </p>
                        <div className="space-y-2">
                          {emotionCycle.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.08 }}
                              className={`rounded-xl p-3 border ${step.color} flex items-center gap-3`}
                            >
                              <span className="text-xl">{step.emoji}</span>
                              <div className="flex-1">
                                 <span className="text-sm font-bold text-foreground">{step.stage}</span>
                                 <p className="text-xs text-muted-foreground">{step.desc}</p>
                              </div>
                              {i < emotionCycle.length - 1 && (
                                <span className="text-muted-foreground/40 text-lg">↓</span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <div className="rounded-xl p-3 bg-primary/5 border border-primary/15 text-center mt-3">
                          <p className="text-sm text-foreground/80">🔑 <strong>המפתח:</strong> לא להגיב בשיא. לחכות שהגל ירד – ואז לבחור תגובה.</p>
                        </div>
                      </div>
                    )}

                    {/* === QUICK TIPS === */}
                    {section.id === 'tips' && (
                      <div className="space-y-3 mt-2">
                        {quickTips.map((tip, i) => (
                          <div key={i} className="rounded-xl bg-secondary/40 p-3">
                             <h4 className="text-sm font-bold text-foreground mb-2">{tip.title}</h4>
                             <ul className="space-y-1.5">
                               {tip.items.map((item, j) => (
                                 <li key={j} className="text-sm text-foreground/70 flex items-start gap-2">
                                  <span className="text-primary mt-0.5 text-xs">✦</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mb-6">
        המידע נשמר באופן מאובטח ונועד לעזור לך להבין איך להתמודד טוב יותר.
      </p>

      <div className="flex justify-center">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>

      <button onClick={() => navigate('/contact')} className="floating-adult-btn">
        <UserCheck size={16} className="inline ml-1" />
        אני צריך מבוגר
      </button>
    </div>
  );
}
