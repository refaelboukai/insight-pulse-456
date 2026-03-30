import { motion } from 'framer-motion';

export default function FlipAnimation() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex items-center gap-4">
        {/* Before - impulse */}
        <motion.div
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-red-50 border border-red-200"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">😤</span>
          <span className="text-[10px] font-medium text-red-500">דחף</span>
        </motion.div>

        {/* Arrow flip */}
        <motion.div
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-2xl"
        >
          🔄
        </motion.div>

        {/* After - opposite */}
        <motion.div
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">😌</span>
          <span className="text-[10px] font-medium text-emerald-500">פעולה הפוכה</span>
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        במקום לפעול מתוך הדחף – בחר בכיוון ההפוך
      </p>
    </div>
  );
}
