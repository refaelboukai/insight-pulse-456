import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@reset/integrations/supabase/client';
import { fireConfetti, fireStars } from '@reset/hooks/useConfetti';
import { useApp } from '@reset/contexts/AppContext';

export interface GameProgress {
  level: number;
  score: number;
  maxLevelReached: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalGamesPlayed: number;
}

const DEFAULT_PROGRESS: GameProgress = {
  level: 1,
  score: 0,
  maxLevelReached: 1,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  totalGamesPlayed: 0,
};

// Adaptive: level up after 3 wins, level down after 2 losses
const WINS_TO_LEVEL_UP = 3;
const LOSSES_TO_LEVEL_DOWN = 2;
const MAX_LEVEL = 10;

export function useBrainTraining(gameType: string) {
  const { student } = useApp();
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);

  useEffect(() => {
    if (!student) { setLoading(false); return; }
    loadProgress();
  }, [student, gameType]);

  const loadProgress = async () => {
    if (!student) return;
    const { data } = await supabase
      .from('brain_training_scores')
      .select('*')
      .eq('student_id', student.id)
      .eq('game_type', gameType)
      .maybeSingle();

    if (data) {
      setProgress({
        level: data.level,
        score: data.score,
        maxLevelReached: data.max_level_reached,
        consecutiveWins: data.consecutive_wins,
        consecutiveLosses: data.consecutive_losses,
        totalGamesPlayed: data.total_games_played,
      });
    }
    setLoading(false);
  };

  const recordResult = useCallback(async (won: boolean, pointsEarned: number) => {
    setIsNewRecord(false);
    setLeveledUp(false);
    const newProgress = { ...progress };
    newProgress.totalGamesPlayed += 1;
    newProgress.score += pointsEarned;

    if (won) {
      newProgress.consecutiveWins += 1;
      newProgress.consecutiveLosses = 0;
      if (newProgress.consecutiveWins >= WINS_TO_LEVEL_UP && newProgress.level < MAX_LEVEL) {
        newProgress.level += 1;
        newProgress.consecutiveWins = 0;
        setLeveledUp(true);
        if (newProgress.level > newProgress.maxLevelReached) {
          newProgress.maxLevelReached = newProgress.level;
          setIsNewRecord(true);
        }
        // 🎉 Level up celebration!
        setTimeout(() => {
          fireConfetti();
          setTimeout(fireStars, 300);
        }, 400);
      }
    } else {
      newProgress.consecutiveLosses += 1;
      newProgress.consecutiveWins = 0;
      if (newProgress.consecutiveLosses >= LOSSES_TO_LEVEL_DOWN && newProgress.level > 1) {
        newProgress.level -= 1;
        newProgress.consecutiveLosses = 0;
      }
    }

    setProgress(newProgress);

    if (student) {
      // Update current scores
      await supabase.from('brain_training_scores').upsert({
        student_id: student.id,
        student_name: student.name,
        game_type: gameType,
        level: newProgress.level,
        score: newProgress.score,
        max_level_reached: newProgress.maxLevelReached,
        consecutive_wins: newProgress.consecutiveWins,
        consecutive_losses: newProgress.consecutiveLosses,
        total_games_played: newProgress.totalGamesPlayed,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,game_type' });

      // Log to history for trend tracking
      await supabase.from('brain_training_history').insert({
        student_id: student.id,
        student_name: student.name,
        game_type: gameType,
        won,
        level_at_time: newProgress.level,
        points_earned: pointsEarned,
      });
    }

    return newProgress;
  }, [progress, student, gameType]);

  return { progress, loading, recordResult, isNewRecord, leveledUp };
}
