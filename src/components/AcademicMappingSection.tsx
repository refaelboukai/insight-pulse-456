import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClipboardCheck, Save, Pencil } from 'lucide-react';

const MAPPING_SUBJECTS = [
  { key: 'math', label: 'מתמטיקה' },
  { key: 'hebrew', label: 'עברית' },
  { key: 'language', label: 'שפה' },
  { key: 'english', label: 'אנגלית' },
] as const;

const GRADE_LEVELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];

type MappingRow = {
  id?: string;
  subject_area: string;
  has_mapping: boolean;
  grade_level: string | null;
};

interface Props {
  studentId: string;
}

export default function AcademicMappingSection({ studentId }: Props) {
  const { user } = useAuth();
  const [savedMappings, setSavedMappings] = useState<Record<string, MappingRow>>({});
  const [localMappings, setLocalMappings] = useState<Record<string, MappingRow>>({});
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasSavedData = Object.values(savedMappings).some(m => m.has_mapping);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('student_mappings' as any)
      .select('*')
      .eq('student_id', studentId);
    const map: Record<string, MappingRow> = {};
    (data as any[] || []).forEach((r: any) => {
      map[r.subject_area] = { id: r.id, subject_area: r.subject_area, has_mapping: r.has_mapping, grade_level: r.grade_level };
    });
    setSavedMappings(map);
    setLocalMappings(map);
    setLoaded(true);
    setEditing(false);
  }, [studentId]);

  useEffect(() => { setLoaded(false); load(); }, [studentId, load]);

  const updateLocal = (subjectArea: string, hasMapping: boolean, gradeLevel: string | null) => {
    setLocalMappings(prev => ({
      ...prev,
      [subjectArea]: { ...prev[subjectArea], subject_area: subjectArea, has_mapping: hasMapping, grade_level: hasMapping ? gradeLevel : null },
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const { key } of MAPPING_SUBJECTS) {
        const local = localMappings[key];
        const saved = savedMappings[key];
        const hasMapping = local?.has_mapping ?? false;
        const gradeLevel = hasMapping ? (local?.grade_level ?? null) : null;

        if (saved?.id) {
          await (supabase.from('student_mappings' as any) as any).update({
            has_mapping: hasMapping,
            grade_level: gradeLevel,
            updated_by: user.id,
          }).eq('id', saved.id);
        } else if (hasMapping) {
          await (supabase.from('student_mappings' as any) as any).insert({
            student_id: studentId,
            subject_area: key,
            has_mapping: hasMapping,
            grade_level: gradeLevel,
            updated_by: user.id,
          });
        }
      }
      toast.success('מיפוי לימודי נשמר');
      await load();
    } catch {
      toast.error('שגיאה בשמירת המיפוי');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalMappings(savedMappings);
    setEditing(false);
  };

  if (!loaded) return null;

  // Read-only view when not editing and data exists
  if (!editing && hasSavedData) {
    return (
      <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            מיפוי לימודי
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}>
            <Pencil className="h-3 w-3" />
            עריכה
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MAPPING_SUBJECTS.map(({ key, label }) => {
            const m = savedMappings[key];
            const hasMapping = m?.has_mapping ?? false;
            return (
              <div key={key} className="p-2 rounded-md border bg-background text-center">
                <Label className="text-xs block mb-1">{label}</Label>
                {hasMapping ? (
                  <span className="text-sm font-semibold text-primary">{m?.grade_level ? `כיתה ${m.grade_level}׳` : 'בוצע'}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">לא בוצע</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Edit mode (or first time - no data yet)
  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          מיפוי לימודי
        </div>
        <div className="flex gap-2">
          {hasSavedData && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel}>ביטול</Button>
          )}
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" />
            {saving ? 'שומר...' : 'שמירה'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MAPPING_SUBJECTS.map(({ key, label }) => {
          const m = localMappings[key];
          const hasMapping = m?.has_mapping ?? false;
          const gradeLevel = m?.grade_level ?? '';
          return (
            <div key={key} className="flex flex-col gap-2 p-2 rounded-md border bg-background">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{hasMapping ? 'בוצע' : 'לא בוצע'}</span>
                  <Switch
                    checked={hasMapping}
                    onCheckedChange={(checked) => updateLocal(key, checked, gradeLevel || null)}
                    className="scale-75"
                  />
                </div>
              </div>
              {hasMapping && (
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">רמת כיתה</Label>
                  <Select value={gradeLevel || ''} onValueChange={(v) => updateLocal(key, true, v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="בחר רמה" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => (
                        <SelectItem key={g} value={g}>{g}׳</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
