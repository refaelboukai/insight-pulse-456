import { Brain, Star, Hash, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const brainTips: Record<string, { area: string; emoji: string; tip: string }> = {
  'זיכרון': {
    area: 'היפוקמפוס',
    emoji: '🧠',
    tip: 'אתה מאמן את ההיפוקמפוס — האזור במוח שאחראי על זיכרון עבודה ויצירת זכרונות חדשים. ככל שתתרגל, החיבורים העצביים שלך מתחזקים!'
  },
  'תגובה מהירה': {
    area: 'קורטקס פרה-פרונטלי',
    emoji: '⚡',
    tip: 'אתה מאמן את הקורטקס הקדם-מצחי — שאחראי על קבלת החלטות מהירה ועיכוב תגובות. זה עוזר לך לחשוב לפני שאתה פועל!'
  },
  'סדרות': {
    area: 'אונה קודקודית',
    emoji: '🔢',
    tip: 'אתה מאמן את האונה הקודקודית — שמזהה דפוסים וחוקיות. זה מחזק חשיבה לוגית ויכולת לחזות מה יקרה הלאה!'
  },
  'Block Blast': {
    area: 'קורטקס חזותי-מרחבי',
    emoji: '🧩',
    tip: 'אתה מאמן את הקורטקס החזותי-מרחבי — שעוזר לך לתכנן צעדים קדימה ולראות את התמונה הגדולה. כמו שחמט למוח!'
  },
  'חשבון מהיר': {
    area: 'חריץ תוך-קודקודי',
    emoji: '🔣',
    tip: 'אתה מאמן את החריץ התוך-קודקודי (IPS) — מרכז העיבוד המספרי במוח. ככל שתתרגל, חישובים יהפכו אוטומטיים יותר!'
  },
  'הבנת הנקרא': {
    area: 'אזור ורניקה',
    emoji: '📖',
    tip: 'אתה מאמן את אזור ורניקה באונה הרקתית — שאחראי על הבנת שפה ומשמעות. קריאה מעשירה את אוצר המילים ואת החשיבה הביקורתית!'
  },
  'קואורדינציה': {
    area: 'המוחון (צרבלום)',
    emoji: '🎯',
    tip: 'אתה מאמן את המוחון (צרבלום) — שמתאם בין עיניים, ידיים ותזמון. הוא גם עוזר ללמידה מוטורית ולדיוק בתנועות!'
  },
  'תפיסה מרחבית': {
    area: 'אונה קודקודית ימנית',
    emoji: '🗺️',
    tip: 'אתה מאמן את האונה הקודקודית הימנית — שאחראית על ניווט, סיבוב מנטלי ותפיסת מרחב. כמו GPS פנימי במוח!'
  },
  'מצא את ההבדלים': {
    area: 'קורטקס חזותי',
    emoji: '🔍',
    tip: 'אתה מאמן את הקורטקס החזותי באונה העורפית — שמזהה פרטים עדינים ושינויים. זה מחדד את הקשב הסלקטיבי והתצפיתנות שלך!'
  },
};

interface GameHeaderProps {
  title: string;
  level: number;
  score: number;
  moves?: number;
}

export default function GameHeader({ title, level, score, moves }: GameHeaderProps) {
  const [showTip, setShowTip] = useState(true);
  const tip = brainTips[title];

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          {tip && (
            <button
              onClick={() => setShowTip(!showTip)}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
              title="טיפ נוירו-פדגוגי"
            >
              <Lightbulb size={18} className={showTip ? 'text-warning' : 'text-muted-foreground'} />
            </button>
          )}
          <span className="flex items-center gap-1">
            <Star size={16} className="text-warning" />
            רמה {level}
          </span>
          <span>{score} נק׳</span>
          {moves !== undefined && (
            <span className="flex items-center gap-1">
              <Hash size={16} />
              {moves}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {tip && showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-foreground/80 leading-relaxed">
              <span className="font-bold text-primary text-base">{tip.emoji} {tip.area}</span>
              <span className="mx-1.5">—</span>
              {tip.tip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}