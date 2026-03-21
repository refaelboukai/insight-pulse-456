
-- Brain training scores table (aggregated per student+game)
CREATE TABLE public.brain_training_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  max_level_reached INTEGER NOT NULL DEFAULT 1,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  consecutive_wins INTEGER NOT NULL DEFAULT 0,
  consecutive_losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, game_type)
);

-- Brain training history table (individual game results)
CREATE TABLE public.brain_training_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  won BOOLEAN NOT NULL DEFAULT false,
  level_at_time INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brain_training_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_training_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for brain_training_scores
CREATE POLICY "Authenticated can insert brain_training_scores" ON public.brain_training_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update brain_training_scores" ON public.brain_training_scores FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff and admin can view brain_training_scores" ON public.brain_training_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own brain_training_scores" ON public.brain_training_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'student'::app_role));

-- RLS policies for brain_training_history
CREATE POLICY "Authenticated can insert brain_training_history" ON public.brain_training_history FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff and admin can view brain_training_history" ON public.brain_training_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own brain_training_history" ON public.brain_training_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'student'::app_role));
