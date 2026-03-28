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
}

export default function LearningStyleResults({ studentId, studentName, isEditable = false, gender }: LearningStyleResultsProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
        {g(gender, 'התלמיד טרם מילא', 'התלמידה טרם מילאה')} את שאלון סגנון הלמידה.
      </div>
    );
  }

  const results = profile.results as any;
  const averages = results?.averages || {};
  const catLabels = CATEGORIES as Record<string, string>;

  return (
    <div className="space-y-3 border rounded-xl p-3 bg-card">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">פרופיל סגנון למידה — {studentName}</span>
      </div>

      {/* Category averages */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(averages).map(([cat, avg]) => (
          <div key={cat} className="text-center p-2 rounded-lg bg-muted/50">
            <span className="text-[10px] text-muted-foreground block">{catLabels[cat] || cat}</span>
            <span className="font-bold text-sm">{String(avg)}</span>
          </div>
        ))}
      </div>

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

      {/* Staff notes */}
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
    </div>
  );
}
