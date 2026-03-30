import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, ChevronLeft, CheckCircle2, Star, Sparkles, RefreshCw, Heart, Loader2, BookOpen, ChefHat, MapPin, Music } from 'lucide-react';
import { getActivityContent, type ActivityOption } from '@reset/data/activityContent';
import { supabase } from '@reset/integrations/supabase/client';

interface ActivityDetailPanelProps {
  activityName: string;
  onClose: () => void;
}

// AI suggestion types
interface AISuggestion {
  title: string;
  artist?: string;
  author?: string;
  description?: string;
  region?: string;
  genre?: string;
  mood?: string;
  level?: string;
  duration?: string;
  emoji?: string;
  ingredients?: string[];
  steps?: string[];
}

const FAVORITES_KEY = 'activity_favorites';

function getFavorites(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}');
  } catch { return {}; }
}

function saveFavorite(type: string, item: string) {
  const favs = getFavorites();
  if (!favs[type]) favs[type] = [];
  if (!favs[type].includes(item)) favs[type].push(item);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function removeFavorite(type: string, item: string) {
  const favs = getFavorites();
  if (favs[type]) {
    favs[type] = favs[type].filter(f => f !== item);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }
}

function isFavorite(type: string, item: string): boolean {
  const favs = getFavorites();
  return favs[type]?.includes(item) || false;
}

const aiTypeIcons: Record<string, React.ReactNode> = {
  books: <BookOpen size={18} />,
  cooking: <ChefHat size={18} />,
  baking: <ChefHat size={18} />,
  nature: <MapPin size={18} />,
  music: <Music size={18} />,
};

const aiTypeLabels: Record<string, string> = {
  books: 'המלצות ספרים',
  cooking: 'מתכונים',
  baking: 'מתכוני אפייה',
  nature: 'מקומות בארץ',
  music: 'שירים מומלצים',
};

function OptionCard({ option, onSelect }: { option: ActivityOption; onSelect: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full text-right rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{option.emoji}</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">{option.title}</h4>
            <p className="text-xs text-muted-foreground">{option.description}</p>
          </div>
        </div>
        <ChevronLeft size={18} className="text-muted-foreground mt-1 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${option.levelColor}`}>
          {option.level}
        </span>
        {option.duration && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={10} /> {option.duration}
          </span>
        )}
      </div>
    </motion.button>
  );
}

function AISuggestionCard({ suggestion, aiType, index }: { suggestion: AISuggestion; aiType: string; index: number }) {
  const itemKey = suggestion.title + (suggestion.artist || suggestion.author || '');
  const [liked, setLiked] = useState(isFavorite(aiType, itemKey));
  const [expanded, setExpanded] = useState(false);

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      removeFavorite(aiType, itemKey);
    } else {
      saveFavorite(aiType, itemKey);
    }
    setLiked(!liked);
  };

  const levelColor = suggestion.level === 'קל' ? 'bg-emerald-100 text-emerald-700'
    : suggestion.level === 'בינוני' ? 'bg-amber-100 text-amber-700'
    : suggestion.level === 'מתקדם' ? 'bg-red-100 text-red-700'
    : 'bg-blue-100 text-blue-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-right p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 flex-1">
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 + 0.1, type: 'spring' }}
              className="text-2xl"
            >
              {suggestion.emoji || '✨'}
            </motion.span>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">{suggestion.title}</h4>
              {suggestion.author && <p className="text-xs text-muted-foreground">{suggestion.author}</p>}
              {suggestion.artist && <p className="text-xs text-muted-foreground">{suggestion.artist}</p>}
              {suggestion.region && <p className="text-xs text-muted-foreground">📍 {suggestion.region}</p>}
              {suggestion.genre && <p className="text-xs text-muted-foreground">{suggestion.genre}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={toggleFav} className="p-1">
              <Heart size={16} className={liked ? 'fill-red-400 text-red-400' : 'text-muted-foreground'} />
            </button>
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="text-muted-foreground">
              <ChevronLeft size={16} />
            </motion.span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {suggestion.level && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelColor}`}>
              {suggestion.level}
            </span>
          )}
          {suggestion.mood && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {suggestion.mood}
            </span>
          )}
          {suggestion.duration && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {suggestion.duration}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {suggestion.description && (
                <p className="text-sm text-foreground/80 leading-relaxed">{suggestion.description}</p>
              )}
              {suggestion.ingredients && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">מצרכים:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.ingredients.map((ing, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {suggestion.steps && suggestion.steps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">שלבים:</p>
                  <div className="space-y-1.5">
                    {suggestion.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">{i + 1}</span>
                        <span className="text-foreground/80">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FavoritesSection({ aiType }: { aiType: string }) {
  const favs = getFavorites()[aiType] || [];
  const [, forceUpdate] = useState(0);

  if (favs.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Heart size={14} className="text-red-400 fill-red-400" />
        <p className="text-xs font-semibold text-muted-foreground">המועדפים שלי</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {favs.map((fav, i) => (
          <span
            key={i}
            className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => { removeFavorite(aiType, fav); forceUpdate(n => n + 1); }}
          >
            {fav} ×
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ActivityDetailPanel({ activityName, onClose }: ActivityDetailPanelProps) {
  const content = getActivityContent(activityName);
  const [selectedOption, setSelectedOption] = useState<ActivityOption | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'options' | 'ai'>('options');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAiSuggestions = useCallback(async () => {
    if (!content.aiType) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const favorites = getFavorites()[content.aiType] || [];
      const { data, error } = await supabase.functions.invoke('activity-suggestions', {
        body: { activityType: content.aiType, userFavorites: favorites },
      });

      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
    } catch (err) {
      console.error('AI suggestions error:', err);
      setAiError('לא הצלחנו לטעון המלצות. נסה שוב.');
    } finally {
      setAiLoading(false);
    }
  }, [content.aiType]);

  useEffect(() => {
    if (activeTab === 'ai' && aiSuggestions.length === 0 && !aiLoading) {
      fetchAiSuggestions();
    }
  }, [activeTab, aiSuggestions.length, aiLoading, fetchAiSuggestions]);

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="text-3xl"
              >
                {content.emoji}
              </motion.span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {selectedOption ? selectedOption.title : content.title}
                </h3>
                <p className="text-xs text-muted-foreground">{activityName}</p>
              </div>
            </div>
            {selectedOption ? (
              <button
                onClick={() => { setSelectedOption(null); setCompletedSteps([]); }}
                className="text-sm text-primary font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                חזרה <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                חזור ללו״ז
              </button>
            )}
          </div>

          {/* Tabs - only show when no option is selected and AI is available */}
          {!selectedOption && content.aiType && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setActiveTab('options')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'options'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                תרגילים ורמות
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Sparkles size={12} />
                {aiTypeLabels[content.aiType] || 'המלצות AI'}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* AI Tab */}
            {activeTab === 'ai' && content.aiType && !selectedOption ? (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FavoritesSection aiType={content.aiType} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {aiTypeIcons[content.aiType]}
                    <p className="text-sm font-semibold text-foreground">{aiTypeLabels[content.aiType]}</p>
                  </div>
                  <button
                    onClick={fetchAiSuggestions}
                    disabled={aiLoading}
                    className="text-xs text-primary flex items-center gap-1 hover:opacity-70 transition-opacity disabled:opacity-40"
                  >
                    <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                    רענן
                  </button>
                </div>

                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Loader2 size={28} className="text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground mt-3">מכין המלצות מיוחדות בשבילך...</p>
                  </div>
                )}

                {aiError && (
                  <div className="text-center py-8">
                    <p className="text-sm text-destructive mb-3">{aiError}</p>
                    <button
                      onClick={fetchAiSuggestions}
                      className="text-sm text-primary underline"
                    >
                      נסה שוב
                    </button>
                  </div>
                )}

                {!aiLoading && !aiError && (
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, idx) => (
                      <AISuggestionCard
                        key={idx}
                        suggestion={suggestion}
                        aiType={content.aiType!}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : !selectedOption ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground mb-3">בחר רמה:</p>
                {content.options.map((option, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <OptionCard option={option} onSelect={() => setSelectedOption(option)} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Level badge & duration */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedOption.levelColor}`}>
                    {selectedOption.level}
                  </span>
                  {selectedOption.duration && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> {selectedOption.duration}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">{selectedOption.description}</p>

                {/* Animated progress bar */}
                {selectedOption.steps && (
                  <>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${(completedSteps.length / selectedOption.steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    {completedSteps.length === selectedOption.steps.length && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200"
                      >
                        <Star size={24} className="text-amber-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-emerald-700">כל הכבוד! סיימת! 🎉</p>
                      </motion.div>
                    )}

                    <div className="space-y-1">
                      {selectedOption.steps.map((step, idx) => {
                        const done = completedSteps.includes(idx);
                        return (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            onClick={() => toggleStep(idx)}
                            className={`w-full flex items-start gap-3 text-right p-2.5 rounded-xl transition-all ${
                              done ? 'bg-emerald-50/50' : 'hover:bg-muted/40'
                            }`}
                          >
                            <div className="flex flex-col items-center flex-shrink-0">
                              <motion.div
                                animate={{
                                  backgroundColor: done ? 'rgb(16 185 129)' : 'transparent',
                                  borderColor: done ? 'rgb(16 185 129)' : 'hsl(var(--primary) / 0.3)',
                                }}
                                className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors"
                              >
                                {done ? (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle2 size={16} className="text-white" />
                                  </motion.div>
                                ) : (
                                  <span className="text-xs font-bold text-primary/60">{idx + 1}</span>
                                )}
                              </motion.div>
                            </div>
                            <p className={`text-sm pt-0.5 leading-relaxed transition-all ${
                              done ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {step}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            חזור ללו״ז 📅
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
