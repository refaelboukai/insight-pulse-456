import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye, Download, Share2, Pencil, Save, GraduationCap,
  ChevronUp, ChevronDown, GripVertical, Palette, Type,
  Settings2, FileText, Loader2,
} from 'lucide-react';
import { generateReportCard, type ReportTemplate, type ReportCardData } from '@/lib/generateReportCard';
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
  { key: 'personalNote', label: 'הערה אישית מהמחנכת', icon: '✉️' },
  { key: 'teamEvaluation', label: 'הערכה תפקודית', icon: '📊' },
  { key: 'socialEmotional', label: 'סיכום חברתי ורגשי', icon: '💛' },
  { key: 'reflections', label: 'הערכה עצמית (היום שלי)', icon: '🌟' },
  { key: 'grades', label: 'ציונים והערכות מקצועיות', icon: '📚' },
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

const TEMPLATES: { key: ReportTemplate; label: string; color: string; desc: string }[] = [
  { key: 'classic', label: 'קלאסי', color: 'bg-blue-500', desc: 'כחול מקצועי' },
  { key: 'warm', label: 'חם', color: 'bg-amber-600', desc: 'גוונים חמים' },
  { key: 'modern', label: 'מודרני', color: 'bg-emerald-600', desc: 'ירוק מודרני' },
  { key: 'formal', label: 'רשמי', color: 'bg-indigo-700', desc: 'סגול רשמי' },
];

const FONT_SIZES: { key: 'small' | 'medium' | 'large'; label: string }[] = [
  { key: 'small', label: 'קטן' },
  { key: 'medium', label: 'רגיל' },
  { key: 'large', label: 'גדול' },
];

const DEFAULT_ORDER = SECTION_OPTIONS.map(s => s.key);

export default function ReportCardPreview({
  open, onOpenChange, student, semester, semesterLabel,
  grades: initialGrades, personalNote: initialNote,
  teamEvaluation: initialTeamEval, reflectionSummary, socialEmotionalSummary: initialSocialSummary,
}: ReportCardPreviewProps) {
  const [enabledSections, setEnabledSections] = useState<Set<string>>(new Set(DEFAULT_ORDER));
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [template, setTemplate] = useState<ReportTemplate>('classic');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [principalName, setPrincipalName] = useState('');

  // Editable data
  const [personalNote, setPersonalNote] = useState(initialNote || '');
  const [socialEmotional, setSocialEmotional] = useState(initialSocialSummary || '');
  const [grades, setGrades] = useState<GradeEntry[]>(initialGrades);
  const [teamEval, setTeamEval] = useState<TeamEvaluation | null>(initialTeamEval);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setPersonalNote(initialNote || '');
      setSocialEmotional(initialSocialSummary || '');
      setGrades(initialGrades);
      setTeamEval(initialTeamEval);
      setEnabledSections(new Set(DEFAULT_ORDER));
      setSectionOrder(DEFAULT_ORDER);
      setEditingSection(null);
      setPreviewUrl(null);
      setShowPreview(false);
    }
  }, [open]);

  const toggleSection = (key: string) => {
    setEnabledSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setSectionOrder(prev => {
      const next = [...prev];
      const t = direction === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
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
      const t = direction === 'up' ? index - 1 : index + 1;
      if (t < 0 || t >= next.length) return prev;
      [next[index], next[t]] = [next[t], next[index]];
      return next;
    });
  };

  const buildData = useCallback((): ReportCardData => ({
    studentName: `${student.first_name} ${student.last_name}`,
    className: student.class_name || '',
    semesterLabel,
    gender: student.gender as Gender,
    grades: enabledSections.has('grades') ? grades : [],
    personalNote: enabledSections.has('personalNote') ? personalNote || null : null,
    teamEvaluation: enabledSections.has('teamEvaluation') ? teamEval : null,
    reflectionSummary: enabledSections.has('reflections') ? reflectionSummary : null,
    socialEmotionalSummary: enabledSections.has('socialEmotional') ? socialEmotional || null : null,
    sectionOrder: sectionOrder.filter(k => enabledSections.has(k)),
    template,
    fontSize,
    showPageNumbers,
    teacherName: teacherName || undefined,
    principalName: principalName || undefined,
  }), [enabledSections, sectionOrder, grades, personalNote, teamEval, reflectionSummary, socialEmotional, student, semesterLabel, template, fontSize, showPageNumbers, teacherName, principalName]);

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

  const handleSaveEdits = async () => {
    try {
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
      for (let i = 0; i < grades.length; i++) {
        const gr = grades[i];
        const orig = initialGrades[i];
        if (!orig) continue;
        if (gr.verbal_evaluation !== orig.verbal_evaluation || gr.grade !== orig.grade || gr.ai_enhanced_evaluation !== orig.ai_enhanced_evaluation) {
          await supabase.from('student_grades')
            .update({
              verbal_evaluation: gr.verbal_evaluation,
              grade: gr.grade,
              ai_enhanced_evaluation: gr.ai_enhanced_evaluation,
            })
            .eq('student_id', student.id)
            .eq('subject', gr.subject);
        }
      }
      toast.success('השינויים נשמרו בהצלחה');
    } catch {
      toast.error('שגיאה בשמירת השינויים');
    }
  };

  // ── Preview dialog ──
  if (showPreview && previewUrl) {
    return (
      <Dialog open={true} onOpenChange={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl); }}>
        <DialogContent dir="rtl" className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> תצוגה מקדימה — {student.first_name} {student.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">בדוק/י את התעודה לפני ההפקה הסופית. ניתן לחזור ולערוך.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30">
            <iframe src={previewUrl} className="w-full h-full border-0" title="תצוגה מקדימה" />
          </div>
          <div className="p-3 border-t flex items-center gap-2 justify-between bg-card">
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

  const sectionOptionsMap = Object.fromEntries(SECTION_OPTIONS.map(s => [s.key, s]));

  // ── Main editing dialog ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            הפקת תעודה — {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">בחר/י תבנית, ערוך תוכן ושנה סדר בלוקים לפני הפקה</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sections" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b px-4 h-9 shrink-0">
            <TabsTrigger value="sections" className="text-xs gap-1"><FileText className="h-3 w-3" /> מדורים ועריכה</TabsTrigger>
            <TabsTrigger value="style" className="text-xs gap-1"><Palette className="h-3 w-3" /> עיצוב ותבנית</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Settings2 className="h-3 w-3" /> הגדרות</TabsTrigger>
          </TabsList>

          {/* ── Tab: Sections & Editing ── */}
          <TabsContent value="sections" className="flex-1 m-0 min-h-0">
            <ScrollArea className="h-full max-h-[calc(92vh-220px)]">
              <div className="p-4 space-y-4">
                {/* Section toggles with reorder */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground mb-2">סדר מדורים בתעודה (חצים להזזה):</p>
                  {sectionOrder.map((key, idx) => {
                    const opt = sectionOptionsMap[key];
                    if (!opt) return null;
                    const hasData = key === 'personalNote' ? !!personalNote
                      : key === 'teamEvaluation' ? !!teamEval
                      : key === 'socialEmotional' ? !!socialEmotional
                      : key === 'reflections' ? !!reflectionSummary
                      : key === 'grades' ? grades.length > 0
                      : true;
                    const isEditing = editingSection === key;
                    return (
                      <div key={key}>
                        <div className={`flex items-center gap-1.5 rounded-lg px-2 py-2 transition-all border ${isEditing ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted/50 hover:border-border'}`}>
                          <div className="flex flex-col gap-0">
                            <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0}
                              className="text-muted-foreground hover:text-primary disabled:opacity-20 p-0.5 transition-colors">
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button onClick={() => moveSection(idx, 'down')} disabled={idx === sectionOrder.length - 1}
                              className="text-muted-foreground hover:text-primary disabled:opacity-20 p-0.5 transition-colors">
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <Checkbox
                              checked={enabledSections.has(key)}
                              onCheckedChange={() => toggleSection(key)}
                            />
                            <span className="text-xs">{opt.icon}</span>
                            <span className="text-xs font-medium flex-1 truncate">{opt.label}</span>
                          </label>
                          {!hasData && <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground shrink-0">אין נתונים</Badge>}
                          {hasData && (
                            <Button
                              variant={isEditing ? 'secondary' : 'ghost'}
                              size="sm"
                              className="h-6 px-2 text-[10px] gap-1 shrink-0"
                              onClick={() => setEditingSection(isEditing ? null : key)}
                            >
                              <Pencil className="h-3 w-3" /> {isEditing ? 'סגור' : 'ערוך'}
                            </Button>
                          )}
                        </div>

                        {/* Inline editing panels — shown directly under the section */}
                        {isEditing && key === 'personalNote' && (
                          <div className="mr-8 mt-1 rounded-lg border border-primary/20 p-3 space-y-2 bg-card shadow-sm">
                            <p className="text-xs font-bold text-foreground">✉️ עריכת הערה אישית:</p>
                            <Textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)}
                              className="text-sm min-h-[100px] leading-relaxed" placeholder="הערה אישית מהמחנכת..." dir="rtl" />
                          </div>
                        )}

                        {isEditing && key === 'socialEmotional' && (
                          <div className="mr-8 mt-1 rounded-lg border border-primary/20 p-3 space-y-2 bg-card shadow-sm">
                            <p className="text-xs font-bold text-foreground">💛 עריכת סיכום חברתי ורגשי:</p>
                            <Textarea value={socialEmotional} onChange={e => setSocialEmotional(e.target.value)}
                              className="text-sm min-h-[100px] leading-relaxed" placeholder="סיכום חברתי ורגשי..." dir="rtl" />
                          </div>
                        )}

                        {isEditing && key === 'teamEvaluation' && teamEval && (
                          <div className="mr-8 mt-1 rounded-lg border border-primary/20 p-3 space-y-2 bg-card shadow-sm max-h-[260px] overflow-y-auto">
                            <p className="text-xs font-bold text-foreground">📊 עריכת הערכה תפקודית:</p>
                            {Object.entries(TEAM_LABELS).map(([k, label]) => {
                              const val = (teamEval as any)?.[k] || '';
                              return (
                                <div key={k} className="flex items-center gap-2">
                                  <span className="text-[10px] w-28 shrink-0 text-muted-foreground font-medium">{label}</span>
                                  <Input value={val} onChange={e => updateTeamEval(k, e.target.value)}
                                    className="h-7 text-xs flex-1" placeholder="—" dir="rtl" />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isEditing && key === 'grades' && grades.length > 0 && (
                          <div className="mr-8 mt-1 rounded-lg border border-primary/20 p-3 space-y-2 bg-card shadow-sm max-h-[320px] overflow-y-auto">
                            <p className="text-xs font-bold text-foreground">📚 עריכת ציונים (ניתן לשנות סדר):</p>
                            {grades.map((gr, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border">
                                <div className="flex flex-col gap-0.5 pt-1">
                                  <button onClick={() => moveGrade(i, 'up')} disabled={i === 0}
                                    className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"><ChevronUp className="h-3 w-3" /></button>
                                  <button onClick={() => moveGrade(i, 'down')} disabled={i === grades.length - 1}
                                    className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"><ChevronDown className="h-3 w-3" /></button>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold w-24">{gr.subject}</span>
                                    <Input type="number" value={gr.grade ?? ''} onChange={e => updateGrade(i, 'grade', e.target.value ? Number(e.target.value) : null)}
                                      className="h-7 w-16 text-xs text-center" placeholder="ציון" min={0} max={100} />
                                  </div>
                                  <Textarea value={gr.ai_enhanced_evaluation || gr.verbal_evaluation || ''} onChange={e => updateGrade(i, 'ai_enhanced_evaluation', e.target.value)}
                                    className="text-[11px] min-h-[50px] leading-relaxed" placeholder="הערכה מילולית..." dir="rtl" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isEditing && key === 'reflections' && (
                          <div className="mr-8 mt-1 rounded-lg border border-primary/20 p-3 bg-card shadow-sm">
                            <p className="text-xs text-muted-foreground">🌟 נתוני ההערכה העצמית מחושבים אוטומטית מטופס ״היום שלי״ ואינם ניתנים לעריכה ידנית.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Tab: Style ── */}
          <TabsContent value="style" className="flex-1 m-0 min-h-0">
            <ScrollArea className="h-full max-h-[calc(92vh-220px)]">
              <div className="p-4 space-y-5">
                {/* Template selection */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">תבנית עיצוב:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setTemplate(t.key)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-right ${
                          template === t.key
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full shrink-0 ${t.color}`} />
                        <div>
                          <div className="text-xs font-bold">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Type className="h-3 w-3" /> גודל טקסט:</p>
                  <div className="flex gap-2">
                    {FONT_SIZES.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setFontSize(f.key)}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all ${
                          fontSize === f.key
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page numbers toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={showPageNumbers} onCheckedChange={v => setShowPageNumbers(!!v)} />
                  <span className="text-xs font-medium">הצג מספרי עמודים</span>
                </label>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Tab: Settings ── */}
          <TabsContent value="settings" className="flex-1 m-0 min-h-0">
            <ScrollArea className="h-full max-h-[calc(92vh-220px)]">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">שם המחנך/ת (לחתימה):</p>
                  <Input value={teacherName} onChange={e => setTeacherName(e.target.value)}
                    className="text-sm h-9" placeholder="ישופיע בשורת החתימה" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground">שם מנהל/ת ביה״ס (לחתימה):</p>
                  <Input value={principalName} onChange={e => setPrincipalName(e.target.value)}
                    className="text-sm h-9" placeholder="ישופיע בשורת החתימה" dir="rtl" />
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 <strong>טיפים:</strong> בחרו את המדורים הרלוונטיים, ערכו ניסוחים לפי הצורך, ובדקו בתצוגה מקדימה לפני ההפקה הסופית. המערכת מחלקת אוטומטית לעמודים ומונעת חיתוך תוכן.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* ── Footer ── */}
        <DialogFooter className="border-t p-3 shrink-0 flex-col gap-2 sm:flex-row bg-card">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" size="sm" onClick={handleSaveEdits} className="gap-1 text-xs">
              <Save className="h-3.5 w-3.5" /> שמור שינויים
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={generating} className="gap-1 text-xs">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              {generating ? 'מפיק...' : 'תצוגה מקדימה'}
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={generating} className="gap-1 text-xs">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {generating ? 'מפיק...' : 'הורדה'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
