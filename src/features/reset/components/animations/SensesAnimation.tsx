import { useState } from 'react';
import { motion } from 'framer-motion';

const senses = [
  { emoji: '👁', label: 'ראייה', color: 'text-blue-500', bg: 'bg-blue-50', items: ['צבע שאתה אוהב', 'אור שמש', 'תמונה יפה'] },
  { emoji: '👂', label: 'שמיעה', color: 'text-purple-500', bg: 'bg-purple-50', items: ['צלילי טבע', 'שיר אהוב', 'שקט'] },
  { emoji: '👃', label: 'ריח', color: 'text-green-500', bg: 'bg-green-50', items: ['קפה', 'בושם', 'פרח'] },
  { emoji: '👅', label: 'טעם', color: 'text-orange-500', bg: 'bg-orange-50', items: ['שוקולד', 'תה חם', 'פרי'] },
  { emoji: '✋', label: 'מגע', color: 'text-rose-500', bg: 'bg-rose-50', items: ['שמיכה רכה', 'מים חמים', 'חיבוק'] },
];

export default function SensesAnimation({ senseIndex }: { senseIndex: number }) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const sense = senses[senseIndex] || senses[0];

  return (
    <div className="flex flex-col items-center gap-3 py-3">
      <motion.div
        className="text-4xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
      >
        {sense.emoji}
      </motion.div>

      <p className={`text-sm font-medium ${sense.color}`}>בחר משהו שמרגיע אותך:</p>

      <div className="flex flex-wrap gap-2 justify-center">
        {sense.items.map(item => (
          <motion.button
            key={item}
            onClick={() => setSelectedItem(item === selectedItem ? null : item)}
            whileTap={{ scale: 0.95 }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              selectedItem === item
                ? `${sense.bg} ${sense.color} border-current font-bold`
                : 'bg-muted/50 text-muted-foreground border-transparent'
            }`}
          >
            {item}
          </motion.button>
        ))}
      </div>

      {selectedItem && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground text-center"
        >
          עצום עיניים לרגע והתמקד ב{selectedItem}... 🌿
        </motion.p>
      )}
    </div>
  );
}
