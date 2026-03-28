import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Brain, Save, Sparkles, AlertTriangle, Loader2, Lightbulb } from 'lucide-react';
import { CATEGORIES } from './LearningStyleQuestionnaire';

import { g, type Gender } from '@/lib/genderUtils';

interface LearningStyleResultsProps {
  studentId: string;
  studentName: string;
  isEditable?: boolean;
  gender?: Gender;
  compact?: boolean;
  recommendationsOnly?: boolean;
}

export default function LearningStyleResults({ studentId, studentName, isEditable = false, gender, compact = false, recommendationsOnly = false }: LearningStyleResultsProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('learning_style_profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      if (data) {
        setProfile(data);
        const existingNotes = (data.results as any)?.staffNotes || '';
        setStaffNotes(existingNotes);
        const existingAi = (data.results as any)?.aiRecommendations || '';
        setAiRecommendations(existingAi);
      }
      setLoading(false);
    };
    load();
  }, [studentId]);

  const handleSaveNotes = async () => {
    if (!profile) return;
    setSaving(true);
    const updatedResults = { ...profile.results, staffNotes };
    const { error } = await supabase
      .from('learning_style_profiles')
      .update({ results: updatedResults })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast.error('שגיאה בשמירה');
    } else {
      toast.success('הערות נשמרו');
      setProfile({ ...profile, results: updatedResults });
    }
  };

  if (loading) return null;
  if (!profile || !profile.is_completed) {
    return (
      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg flex items-center gap-1.5">
        <Brain className="h-3.5 w-3.5" />
        {g(gender, 'התלמיד לא ביצע', 'התלמידה לא ביצעה')} שאלון סגנון למידה.
      </div>
    );
  }

  const results = profile.results as any;
  const averages = results?.averages || {};
  const catLabels = CATEGORIES as Record<string, string>;

  const getScoreLabel = (avg: number): { label: string; color: string } => {
    if (avg >= 4) return { label: 'גבוה — מעדיף מאוד', color: 'text-green-700' };
    if (avg >= 3) return { label: 'בינוני — מתפקד היטב', color: 'text-blue-700' };
    if (avg >= 2) return { label: 'נמוך — פחות מתאים', color: 'text-amber-700' };
    return { label: 'נמוך מאוד', color: 'text-red-700' };
  };

  // Recommendations-only mode for pedagogy goals context
  if (recommendationsOnly) {
    const hasRecommendations = results.recommendations?.length > 0 || results.aiRecommendations;
    return (
      <div className="space-y-2 border rounded-lg p-3 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="font-semibold text-xs text-primary">המלצות מסגנון למידה</span>
        </div>
        {results.recommendations?.length > 0 && (
          <ul className="space-y-1">
            {results.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        )}
        {results.aiRecommendations && (
          <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed">{results.aiRecommendations}</p>
        )}
        {/* AI generate button - always available in recommendationsOnly mode */}
        <Button
          size="sm"
          variant={hasRecommendations ? "ghost" : "default"}
          onClick={async () => {
            setLoadingAi(true);
            setAiRecommendations('');
            try {
              const { data, error } = await supabase.functions.invoke('learning-style-recommendations', {
                body: {
                  studentName,
                  dominant: results?.dominant || [],
                  averages: results?.averages || {},
                  challenges: results?.challenges || [],
                  staffNotes: (results?.staffNotes || ''),
                  gender: gender || 'male',
                },
              });
              if (error) throw error;
              if (data?.error) {
                toast.error(data.error);
              } else {
                setAiRecommendations(data.recommendations);
                const updatedResults = { ...profile.results, aiRecommendations: data.recommendations };
                await supabase.from('learning_style_profiles').update({ results: updatedResults }).eq('id', profile.id);
                setProfile({ ...profile, results: updatedResults });
                toast.success('המלצות AI נוצרו ונשמרו');
              }
            } catch (e: any) {
              toast.error('שגיאה בייצור ההמלצות');
              console.error(e);
            } finally {
              setLoadingAi(false);
            }
          }}
          disabled={loadingAi}
          className="gap-1.5 text-xs"
        >
          {loadingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
          {loadingAi ? 'מייצר המלצות...' : hasRecommendations ? 'חדש המלצות AI' : 'צור המלצות AI'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border rounded-xl p-3 bg-card">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">פרופיל סגנון למידה — {studentName}</span>
      </div>

      {/* Category averages */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(averages).map(([cat, avg]) => {
            const score = getScoreLabel(Number(avg));
            return (
              <div key={cat} className="text-center p-2 rounded-lg bg-muted/50">
                <span className="text-[10px] text-muted-foreground block">{catLabels[cat] || cat}</span>
                <span className="font-bold text-sm">{String(avg)}</span>
                <span className={`text-[9px] block mt-0.5 ${score.color}`}>{score.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Dominant styles */}
      {results.dominant && (
        <div>
          <span className="text-xs font-medium text-muted-foreground">סגנונות דומיננטיים:</span>
          <div className="flex gap-1 mt-1 flex-wrap">
            {results.dominant.map((d: string) => (
              <Badge key={d} variant="default" className="text-xs">{catLabels[d] || d}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      {results.challenges?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" /> סתירות שזוהו:
          </span>
          {results.challenges.map((c: string, i: number) => (
            <p key={i} className="text-xs text-destructive/80 bg-destructive/5 rounded-lg px-2 py-1">{c}</p>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {results.recommendations?.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">המלצות הוראה:</span>
          <ul className="space-y-1">
            {results.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Recommendations button */}
      {isEditable && profile?.is_completed && (
        <div className="space-y-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setLoadingAi(true);
              setAiRecommendations('');
              try {
                const results = profile.results as any;
                const { data, error } = await supabase.functions.invoke('learning-style-recommendations', {
                  body: {
                    studentName,
                    dominant: results?.dominant || [],
                    averages: results?.averages || {},
                    challenges: results?.challenges || [],
                    staffNotes: (results?.staffNotes || ''),
                    gender: gender || 'male',
                  },
                });
                if (error) throw error;
                if (data?.error) {
                  toast.error(data.error);
                } else {
                  setAiRecommendations(data.recommendations);
                  // Persist to DB
                  const updatedResults = { ...profile.results, aiRecommendations: data.recommendations };
                  await supabase.from('learning_style_profiles').update({ results: updatedResults }).eq('id', profile.id);
                  setProfile({ ...profile, results: updatedResults });
                }
              } catch (e: any) {
                toast.error('שגיאה בייצור ההמלצות');
                console.error(e);
              } finally {
                setLoadingAi(false);
              }
            }}
            disabled={loadingAi}
            className="gap-1.5 text-xs"
          >
            {loadingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
            {loadingAi ? 'מייצר המלצות...' : aiRecommendations ? 'חדש המלצות AI' : 'צור המלצות AI למורה'}
          </Button>

          {aiRecommendations && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> המלצות AI מותאמות אישית
              </span>
              <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed">{aiRecommendations}</p>
            </div>
          )}
        </div>
      )}
      {isEditable && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs">הערות צוות — סגנונות/שיטות נוספות שנמצאו כעובדות:</Label>
          <Textarea
            className="text-sm min-h-[80px]"
            value={staffNotes}
            onChange={e => setStaffNotes(e.target.value)}
            placeholder={`הוסף שיטות למידה או תובנות שעובדות עבור ${g(gender, 'התלמיד', 'התלמידה')}...`}
          />
          <Button size="sm" onClick={handleSaveNotes} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'שומר...' : 'שמור הערות'}
          </Button>
        </div>
      )}

      {/* Show staff notes if they exist (read-only) */}
      {!isEditable && results.staffNotes && (
        <div className="pt-2 border-t">
          <span className="text-xs font-medium text-muted-foreground">הערות הצוות:</span>
          <p className="text-xs text-foreground/80 mt-1 bg-muted/50 rounded-lg p-2">{results.staffNotes}</p>
        </div>
      )}

      {/* Show saved AI recommendations in read-only mode */}
      {!isEditable && results.aiRecommendations && (
        <div className="pt-2 border-t">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> המלצות AI
            </span>
            <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed">{results.aiRecommendations}</p>
          </div>
        </div>
      )}
    </div>
  );
}
