import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, ChevronLeft, CheckCircle2, Star, Sparkles, RefreshCw, Heart, Loader2 } from 'lucide-react';
import { getActivityContent, type ActivityOption } from '@/reset-zone/data/activityContent';

interface ActivityDetailPanelProps { activityName: string; onClose: () => void; }

function OptionCard({ option, onSelect }: { option: ActivityOption; onSelect: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSelect} className="w-full text-right rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2"><span className="text-2xl">{option.emoji}</span><div><h4 className="font-bold text-sm text-foreground">{option.title}</h4><p className="text-xs text-muted-foreground">{option.description}</p></div></div>
        <ChevronLeft size={18} className="text-muted-foreground mt-1 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${option.levelColor}`}>{option.level}</span>
        {option.duration && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {option.duration}</span>}
      </div>
    </motion.button>
  );
}

export default function ActivityDetailPanel({ activityName, onClose }: ActivityDetailPanelProps) {
  const content = getActivityContent(activityName);
  const [selectedOption, setSelectedOption] = useState<ActivityOption | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (idx: number) => { setCompletedSteps(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} onClick={e => e.stopPropagation()} className="bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{content.emoji}</span>
              <div><h3 className="text-lg font-bold text-foreground">{selectedOption ? selectedOption.title : content.title}</h3><p className="text-xs text-muted-foreground">{activityName}</p></div>
            </div>
            {selectedOption ? (
              <button onClick={() => { setSelectedOption(null); setCompletedSteps([]); }} className="text-sm text-primary font-medium flex items-center gap-1">חזרה <ArrowRight size={14} /></button>
            ) : (
              <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">חזור ללו״ז</button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!selectedOption ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">בחר רמה:</p>
              {content.options.map((option, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <OptionCard option={option} onSelect={() => setSelectedOption(option)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedOption.levelColor}`}>{selectedOption.level}</span>
                {selectedOption.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {selectedOption.duration}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{selectedOption.description}</p>
              {selectedOption.steps && (
                <>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(completedSteps.length / selectedOption.steps.length) * 100}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  {completedSteps.length === selectedOption.steps.length && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <Star size={24} className="text-amber-400 mx-auto mb-1" /><p className="text-sm font-bold text-emerald-700">כל הכבוד! סיימת! 🎉</p>
                    </motion.div>
                  )}
                  <div className="space-y-1">
                    {selectedOption.steps.map((step, idx) => {
                      const done = completedSteps.includes(idx);
                      return (
                        <motion.button key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }} onClick={() => toggleStep(idx)} className={`w-full flex items-start gap-3 text-right p-2.5 rounded-xl transition-all ${done ? 'bg-emerald-50/50' : 'hover:bg-muted/40'}`}>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <motion.div animate={{ backgroundColor: done ? 'rgb(16 185 129)' : 'transparent', borderColor: done ? 'rgb(16 185 129)' : 'hsl(var(--primary) / 0.3)' }} className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors">
                              {done ? <CheckCircle2 size={16} className="text-white" /> : <span className="text-xs font-bold text-primary/60">{idx + 1}</span>}
                            </motion.div>
                          </div>
                          <p className={`text-sm pt-0.5 leading-relaxed transition-all ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="w-full py-2.5 text-sm rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">חזור ללו״ז 📅</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
