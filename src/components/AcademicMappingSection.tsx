import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ClipboardCheck } from 'lucide-react';

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
  const [mappings, setMappings] = useState<Record<string, MappingRow>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('student_mappings' as any)
      .select('*')
      .eq('student_id', studentId);
    const map: Record<string, MappingRow> = {};
    (data as any[] || []).forEach((r: any) => {
      map[r.subject_area] = { id: r.id, subject_area: r.subject_area, has_mapping: r.has_mapping, grade_level: r.grade_level };
    });
    setMappings(map);
    setLoaded(true);
  }, [studentId]);

  useEffect(() => { setLoaded(false); load(); }, [studentId, load]);

  const upsert = async (subjectArea: string, hasMapping: boolean, gradeLevel: string | null) => {
    if (!user) return;
    const existing = mappings[subjectArea];
    if (existing?.id) {
      await (supabase.from('student_mappings' as any) as any).update({
        has_mapping: hasMapping,
        grade_level: hasMapping ? gradeLevel : null,
        updated_by: user.id,
      }).eq('id', existing.id);
    } else {
      await (supabase.from('student_mappings' as any) as any).insert({
        student_id: studentId,
        subject_area: subjectArea,
        has_mapping: hasMapping,
        grade_level: hasMapping ? gradeLevel : null,
        updated_by: user.id,
      });
    }
    setMappings(prev => ({
      ...prev,
      [subjectArea]: { ...prev[subjectArea], subject_area: subjectArea, has_mapping: hasMapping, grade_level: hasMapping ? gradeLevel : null },
    }));
    toast.success('מיפוי עודכן');
  };

  if (!loaded) return null;

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        מיפוי לימודי
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MAPPING_SUBJECTS.map(({ key, label }) => {
          const m = mappings[key];
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
                    onCheckedChange={(checked) => upsert(key, checked, gradeLevel || null)}
                    className="scale-75"
                  />
                </div>
              </div>
              {hasMapping && (
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">רמת כיתה</Label>
                  <Select value={gradeLevel || ''} onValueChange={(v) => upsert(key, true, v)}>
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
