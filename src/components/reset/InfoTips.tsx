import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronDown, Brain, Lightbulb, Heart, Zap, AlertTriangle, RotateCcw, Sparkles, Star } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

const topCards = [
  { title: 'איך רגשות עובדים', content: 'רגשות הם אותות מהגוף שעוזרים לנו להבין מה חשוב לנו. הם לא טובים או רעים – הם מידע.', icon: '🧠' },
  { title: 'למה לפעמים קשה להירגע', content: 'כשהמוח מזהה סכנה, הוא מפעיל תגובת לחימה-בריחה. זה תקין – אבל אפשר ללמד אותו להירגע.', icon: '💭' },
  { title: 'איך עצירה קצרה משנה תגובה', content: 'כשעוצרים לרגע, אנחנו נותנים למוח הרציונלי לעבוד. זה ההבדל בין תגובה אוטומטית לבחירה מודעת.', icon: '⏸️' },
  { title: 'איך להתמודד עם ריב', content: 'לנשום, להקשיב, לנסות להבין את הצד השני. לבקש הפסקה אם צריך.', icon: '🤝' },
  { title: 'איך להירגע מהר', content: '3 דברים: נשימות עמוקות, קרקוע דרך החושים, והזזת הגוף.', icon: '🌊' },
];

const chemicals = [
  { name: 'דופמין', emoji: '⚡', what: 'מוטיבציה ותחושת סיפוק', action: 'להשלים משימה קטנה, ללמוד משהו חדש' },
  { name: 'סרוטונין', emoji: '💛', what: 'רוגע ויציבות', action: 'אור שמש, פעילות גופנית, שינה טובה' },
  { name: 'אוקסיטוצין', emoji: '🤗', what: 'קרבה ושייכות', action: 'שיחה נעימה, חיבוק, עזרה למישהו' },
  { name: 'אנדורפינים', emoji: '🏃', what: 'הקלה ושיפור מצב רוח', action: 'תנועה, צחוק, מוזיקה' },
];

const emotionCycle = [
  { stage: 'טריגר', emoji: '💥', desc: 'משהו קורה שמעורר רגש', color: 'bg-destructive/10' },
  { stage: 'עלייה', emoji: '📈', desc: 'הרגש מתחזק, הגוף מגיב', color: 'bg-amber-100' },
  { stage: 'שיא', emoji: '🔥', desc: 'הנקודה הכי חזקה', color: 'bg-destructive/15' },
  { stage: 'ירידה', emoji: '📉', desc: 'הרגש מתחיל לרדת', color: 'bg-primary/10' },
  { stage: 'איזון', emoji: '☁️', desc: 'חזרה לשגרה', color: 'bg-emerald-50' },
];

const quickTips = [
  { title: '3 דברים שעוזרים להירגע מהר', items: ['נשימות עמוקות – 4 שניות פנימה, 6 שניות החוצה', 'לגעת במשהו קר', 'להזיז את הגוף'] },
  { title: 'איך לעצור ריב', items: ['לקחת צעד אחורה', 'לנשום פעמיים', 'להגיד: "אני צריך רגע"'] },
  { title: 'מה לעשות כשכועסים מאוד', items: ['לספור עד 10', 'להחזיק קרח ביד', 'ללכת למקום שקט'] },
];

type SectionId = 'basics' | 'chemicals' | 'cycle' | 'tips';

const sections: { id: SectionId; title: string; icon: React.ReactNode; subtitle: string }[] = [
  { id: 'basics', title: 'איך רגשות עובדים?', icon: <Sparkles size={18} />, subtitle: '5 דברים חשובים שכדאי לדעת' },
  { id: 'chemicals', title: 'החומרים במוח', icon: <Brain size={18} />, subtitle: 'דופמין, סרוטונין ועוד' },
  { id: 'cycle', title: 'מעגל הרגש', icon: <RotateCcw size={18} />, subtitle: 'כל רגש עובר מעגל ותמיד יורד' },
  { id: 'tips', title: 'טיפים מהירים', icon: <Lightbulb size={18} />, subtitle: 'כלים פרקטיים ליישום מיידי' },
];

export default function InfoTips() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen p-4 pb-20" style={{ background: 'var(--gradient-warm)' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
            <Brain size={16} className="text-primary" />
            <span className="text-xs font-medium text-primary">ידע = כוח</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">מידע וטיפים</h2>
          <p className="text-sm text-muted-foreground mt-1">להבין את עצמך זה הצעד הראשון</p>
        </motion.div>

        <div className="space-y-3 max-w-md mx-auto">
          {sections.map((section, si) => (
            <motion.div key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
              className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <button onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{section.icon}</div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-bold text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                </div>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${openSection === section.id ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {openSection === section.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 pt-0 space-y-3">
                      {section.id === 'basics' && topCards.map((card, i) => (
                        <div key={i} className="rounded-xl bg-secondary/30 p-3 cursor-pointer" onClick={() => setExpandedCard(expandedCard === i ? null : i)}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{card.icon}</span>
                            <span className="text-sm font-semibold text-foreground">{card.title}</span>
                          </div>
                          {expandedCard === i && <p className="text-xs text-muted-foreground mt-2">{card.content}</p>}
                        </div>
                      ))}

                      {section.id === 'chemicals' && chemicals.map((chem, i) => (
                        <div key={i} className="rounded-xl bg-secondary/30 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{chem.emoji}</span>
                            <span className="text-sm font-bold text-foreground">{chem.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{chem.what}</p>
                          <p className="text-xs text-primary mt-1">💡 {chem.action}</p>
                        </div>
                      ))}

                      {section.id === 'cycle' && (
                        <div className="space-y-2">
                          {emotionCycle.map((phase, i) => (
                            <div key={i} className={`rounded-xl p-3 ${phase.color} flex items-center gap-3`}>
                              <span className="text-xl">{phase.emoji}</span>
                              <div>
                                <p className="text-sm font-bold text-foreground">{phase.stage}</p>
                                <p className="text-xs text-muted-foreground">{phase.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.id === 'tips' && quickTips.map((tip, i) => (
                        <div key={i} className="rounded-xl bg-secondary/30 p-3">
                          <p className="text-sm font-bold text-foreground mb-2">{tip.title}</p>
                          <ul className="space-y-1">
                            {tip.items.map((item, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-primary mt-0.5">•</span>{item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
