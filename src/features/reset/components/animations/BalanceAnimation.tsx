import { motion } from 'framer-motion';

export default function BalanceAnimation() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Balance scale visual */}
      <div className="relative w-48 h-28">
        {/* Center pillar */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-16 bg-muted-foreground/30 rounded-full" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-10 h-2 bg-muted-foreground/30 rounded-full" />

        {/* Balance beam */}
        <motion.div
          className="absolute top-4 left-0 right-0 h-1 bg-foreground/40 rounded-full origin-center"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Left pan - Emotional */}
          <motion.div className="absolute -left-2 -top-8 flex flex-col items-center">
            <span className="text-2xl">🧡</span>
            <span className="text-[10px] font-medium text-red-400 mt-0.5">רגש</span>
          </motion.div>

          {/* Right pan - Rational */}
          <motion.div className="absolute -right-2 -top-8 flex flex-col items-center">
            <span className="text-2xl">🧠</span>
            <span className="text-[10px] font-medium text-blue-400 mt-0.5">היגיון</span>
          </motion.div>
        </motion.div>

        {/* Wise mind center */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-0"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">⭐</span>
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        המוח החכם נמצא באיזון – בין הלב לשכל
      </p>
    </div>
  );
}
