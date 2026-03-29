import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Share2, Pencil, Save, X, GraduationCap, ChevronUp, ChevronDown } from 'lucide-react';
import { generateReportCard } from '@/lib/generateReportCard';
import { shareOrDownload, downloadBlob } from '@/lib/downloadFile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Gender } from '@/lib/genderUtils';

interface GradeEntry {
  subject: string;
  grade: number | null;
  verbal_evaluation: string | null;
  ai_enhanced_evaluation: string | null;
}

interface TeamEvaluation {
  behavior?: string | null;
  independent_work?: string | null;
  group_work?: string | null;
  emotional_regulation?: string | null;
  general_functioning?: string | null;
  helping_others?: string | null;
  environmental_care?: string | null;
  duties_performance?: string | null;
  studentship?: string | null;
  problem_solving?: string | null;
  creative_thinking?: string | null;
  perseverance?: string | null;
  emotional_tools?: string | null;
  cognitive_flexibility?: string | null;
  self_efficacy?: string | null;
}

interface ReflectionSummary {
  class_presence: number;
  behavior: number;
  social_interaction: number;
  academic_tasks: number;
}

interface ReportCardPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    class_name: string | null;
    gender: string | null;
  };
  semester: string;
  semesterLabel: string;
  grades: GradeEntry[];
  personalNote: string | null;
  teamEvaluation: TeamEvaluation | null;
  reflectionSummary: ReflectionSummary | null;
  socialEmotionalSummary: string | null;
}

const SECTION_OPTIONS = [
  { key: 'personalNote', label: 'הערה אישית מהמחנכת' },
  { key: 'teamEvaluation', label: 'הערכה תפקודית' },
  { key: 'socialEmotional', label: 'סיכום חברתי ורגשי' },
  { key: 'reflections', label: 'הערכה עצמית (היום שלי)' },
  { key: 'grades', label: 'ציונים והערכות מקצועיות' },
];

const TEAM_LABELS: Record<string, string> = {
  behavior: 'התנהגות', independent_work: 'עבודה עצמאית', group_work: 'עבודה בקבוצה',
  emotional_regulation: 'ויסות רגשי', general_functioning: 'תפקוד כללי',
  helping_others: 'עזרה לאחרים', environmental_care: 'אכפתיות לסביבה',
  duties_performance: 'ביצוע תורנויות', studentship: 'תלמידאות',
  problem_solving: 'פתרון בעיות', creative_thinking: 'חשיבה יצירתית',
  perseverance: 'התמדה וכוח רצון', emotional_tools: 'שימוש בכלים שונים',
  cognitive_flexibility: 'גמישות מחשבתית', self_efficacy: 'מסוגלות עצמית',
};

export default function ReportCardPreview({
  open, onOpenChange, student, semester, semesterLabel,
  grades: initialGrades, personalNote: initialNote,
  teamEvaluation: initialTeamEval, reflectionSummary, socialEmotionalSummary: initialSocialSummary,
}: ReportCardPreviewProps) {
  const [enabledSections, setEnabledSections] = useState<Set<string>>(new Set(SECTION_OPTIONS.map(s => s.key)));
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Editable data
  const [personalNote, setPersonalNote] = useState(initialNote || '');
  const [socialEmotional, setSocialEmotional] = useState(initialSocialSummary || '');
  const [grades, setGrades] = useState<GradeEntry[]>(initialGrades);
  const [teamEval, setTeamEval] = useState<TeamEvaluation | null>(initialTeamEval);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPersonalNote(initialNote || '');
      setSocialEmotional(initialSocialSummary || '');
      setGrades(initialGrades);
      setTeamEval(initialTeamEval);
      setEnabledSections(new Set(SECTION_OPTIONS.map(s => s.key)));
      setEditingSection(null);
      setPreviewUrl(null);
      setShowPreview(false);
    }
  }, [open]);

  const toggleSection = (key: string) => {
    setEnabledSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateGrade = (index: number, field: keyof GradeEntry, value: any) => {
    setGrades(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const updateTeamEval = (key: string, value: string) => {
    setTeamEval(prev => prev ? { ...prev, [key]: value } : { [key]: value });
  };

  const moveGrade = (index: number, direction: 'up' | 'down') => {
    setGrades(prev => {
      const next = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
      return next;
    });
  };

  const buildData = useCallback(() => ({
    studentName: `${student.first_name} ${student.last_name}`,
    className: student.class_name || '',
    semesterLabel,
    gender: student.gender as Gender,
    grades: enabledSections.has('grades') ? grades : [],
    personalNote: enabledSections.has('personalNote') ? personalNote || null : null,
    teamEvaluation: enabledSections.has('teamEvaluation') ? teamEval : null,
    reflectionSummary: enabledSections.has('reflections') ? reflectionSummary : null,
    socialEmotionalSummary: enabledSections.has('socialEmotional') ? socialEmotional || null : null,
  }), [enabledSections, grades, personalNote, teamEval, reflectionSummary, socialEmotional, student, semesterLabel]);

  const handlePreview = async () => {
    setGenerating(true);
    try {
      const blob = await generateReportCard(buildData());
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch {
      toast.error('שגיאה בהפקת תצוגה מקדימה');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await generateReportCard(buildData());
      const semSuffix = semester === 'all' ? 'שנתי' : semesterLabel;
      downloadBlob(blob, `תעודה_${semSuffix}_${student.first_name}_${student.last_name}.pdf`);
      toast.success('התעודה הורדה בהצלחה');
    } catch {
      toast.error('שגיאה בהפקת התעודה');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await generateReportCard(buildData());
      const semSuffix = semester === 'all' ? 'שנתי' : semesterLabel;
      await shareOrDownload(blob, `תעודה_${semSuffix}_${student.first_name}_${student.last_name}.pdf`);
    } catch {
      toast.error('שגיאה בשיתוף');
    } finally {
      setGenerating(false);
    }
  };

  // Save edits back to DB
  const handleSaveEdits = async () => {
    try {
      // Save personal note & social emotional back to evaluations
      if (personalNote !== initialNote || socialEmotional !== initialSocialSummary) {
        const updates: any = {};
        if (personalNote !== initialNote) updates.personal_note = personalNote;
        if (socialEmotional !== initialSocialSummary) updates.social_emotional_summary = socialEmotional;
        if (teamEval) {
          Object.entries(teamEval).forEach(([k, v]) => {
            if (v !== (initialTeamEval as any)?.[k]) updates[k] = v;
          });
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('student_evaluations')
            .update(updates)
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
            .limit(1);
        }
      }
      // Save grade changes
      for (let i = 0; i < grades.length; i++) {
        const g = grades[i];
        const orig = initialGrades[i];
        if (!orig) continue;
        if (g.verbal_evaluation !== orig.verbal_evaluation || g.grade !== orig.grade || g.ai_enhanced_evaluation !== orig.ai_enhanced_evaluation) {
          await supabase.from('student_grades')
            .update({
              verbal_evaluation: g.verbal_evaluation,
              grade: g.grade,
              ai_enhanced_evaluation: g.ai_enhanced_evaluation,
            })
            .eq('student_id', student.id)
            .eq('subject', g.subject);
        }
      }
      toast.success('השינויים נשמרו בהצלחה');
    } catch {
      toast.error('שגיאה בשמירת השינויים');
    }
  };

  // Preview window
  if (showPreview && previewUrl) {
    return (
      <Dialog open={true} onOpenChange={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl); }}>
        <DialogContent dir="rtl" className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" /> תצוגה מקדימה — {student.first_name} {student.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs">בדוק/י את התעודה לפני ההפקה הסופית</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe src={previewUrl} className="w-full h-full border-0" title="תצוגה מקדימה" />
          </div>
          <div className="p-3 border-t flex items-center gap-2 justify-between">
            <Button variant="outline" size="sm" onClick={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl); }}>
              <Pencil className="h-3.5 w-3.5 ml-1" /> חזרה לעריכה
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleShare} disabled={generating}>
                <Share2 className="h-3.5 w-3.5 ml-1" /> שיתוף
              </Button>
              <Button size="sm" onClick={handleDownload} disabled={generating}>
                <Download className="h-3.5 w-3.5 ml-1" /> הורדה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            הפקת תעודה — {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription className="text-xs">בחר/י מה להציג ועריכת תוכן לפני ההפקה</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section toggles */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">בחירת תבניות להצגה:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {SECTION_OPTIONS.map(opt => {
                const hasData = opt.key === 'personalNote' ? !!personalNote
                  : opt.key === 'teamEvaluation' ? !!teamEval
                  : opt.key === 'socialEmotional' ? !!socialEmotional
                  : opt.key === 'reflections' ? !!reflectionSummary
                  : opt.key === 'grades' ? grades.length > 0
                  : true;
                return (
                  <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded-lg px-2.5 py-2 transition-colors">
                    <Checkbox
                      checked={enabledSections.has(opt.key)}
                      onCheckedChange={() => toggleSection(opt.key)}
                    />
                    <span className="text-xs font-medium flex-1">{opt.label}</span>
                    {!hasData && <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">אין נתונים</Badge>}
                    {hasData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px] gap-0.5 text-primary"
                        onClick={(e) => { e.preventDefault(); setEditingSection(editingSection === opt.key ? null : opt.key); }}
                      >
                        <Pencil className="h-3 w-3" /> ערוך
                      </Button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Inline editing panels */}
          {editingSection === 'personalNote' && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-bold">עריכת הערה אישית:</p>
              <Textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)}
                className="text-sm min-h-[80px]" placeholder="הערה אישית מהמחנכת..." />
            </div>
          )}

          {editingSection === 'socialEmotional' && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-bold">עריכת סיכום חברתי ורגשי:</p>
              <Textarea value={socialEmotional} onChange={e => setSocialEmotional(e.target.value)}
                className="text-sm min-h-[80px]" placeholder="סיכום חברתי ורגשי..." />
            </div>
          )}

          {editingSection === 'teamEvaluation' && teamEval && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/30 max-h-[250px] overflow-y-auto">
              <p className="text-xs font-bold">עריכת הערכה תפקודית:</p>
              {Object.entries(TEAM_LABELS).map(([key, label]) => {
                const val = (teamEval as any)?.[key] || '';
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] w-24 shrink-0 text-muted-foreground">{label}</span>
                    <Input value={val} onChange={e => updateTeamEval(key, e.target.value)}
                      className="h-7 text-xs flex-1" placeholder="—" />
                  </div>
                );
              })}
            </div>
          )}

          {editingSection === 'grades' && grades.length > 0 && (
            <div className="rounded-xl border p-3 space-y-2 bg-muted/30 max-h-[300px] overflow-y-auto">
              <p className="text-xs font-bold">עריכת ציונים (ניתן לשנות סדר):</p>
              {grades.map((g, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-card border">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveGrade(i, 'up')} disabled={i === 0} className="text-muted-foreground hover:text-primary disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => moveGrade(i, 'down')} disabled={i === grades.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold w-20">{g.subject}</span>
                      <Input type="number" value={g.grade ?? ''} onChange={e => updateGrade(i, 'grade', e.target.value ? Number(e.target.value) : null)}
                        className="h-6 w-14 text-xs text-center" placeholder="ציון" />
                    </div>
                    <Textarea value={g.ai_enhanced_evaluation || g.verbal_evaluation || ''} onChange={e => updateGrade(i, 'ai_enhanced_evaluation', e.target.value)}
                      className="text-[10px] min-h-[40px]" placeholder="הערכה מילולית..." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" size="sm" onClick={handleSaveEdits} className="gap-1 text-xs">
              <Save className="h-3.5 w-3.5" /> שמור שינויים
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={generating} className="gap-1 text-xs">
              <Eye className="h-3.5 w-3.5" /> {generating ? 'מפיק...' : 'תצוגה מקדימה'}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={generating} className="gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> {generating ? 'מפיק...' : 'הורדה'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
