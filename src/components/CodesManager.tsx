import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RefreshCw, Shield, Users, User, Copy, UserRound, Eye, EyeOff, Download } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';
import { downloadWorkbook } from '@/lib/excelDownload';

type Student = Database['public']['Tables']['students']['Row'] & { parent_code?: string };

const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

interface Props {
  students: Student[];
  onRefresh: () => void;
}

export default function CodesManager({ students, onRefresh }: Props) {
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regeneratingParent, setRegeneratingParent] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('הקוד הועתק');
  };

  const handleToggleActive = async (student: Student) => {
    const { error } = await supabase.from('students').update({ is_active: !student.is_active }).eq('id', student.id);
    if (error) { toast.error('שגיאה בעדכון'); return; }
    toast.success(student.is_active ? 'הקוד הושבת' : 'הקוד הופעל');
    onRefresh();
  };

  const handleRegenerate = async (student: Student) => {
    setRegenerating(student.id);
    const newCode = generateRandomCode();
    const { error } = await supabase.from('students').update({ student_code: newCode }).eq('id', student.id);
    if (error) { toast.error('שגיאה ביצירת קוד חדש'); }
    else { toast.success(`קוד תלמיד חדש: ${newCode}`); onRefresh(); }
    setRegenerating(null);
  };

  const handleRegenerateParent = async (student: Student) => {
    setRegeneratingParent(student.id);
    const newCode = 'P' + generateRandomCode().slice(0, 7);
    const { error } = await (supabase.from('students') as any).update({ parent_code: newCode }).eq('id', student.id);
    if (error) { toast.error('שגיאה ביצירת קוד הורה חדש'); }
    else { toast.success(`קוד הורה חדש: ${newCode}`); onRefresh(); }
    setRegeneratingParent(null);
  };

  const handleToggleParentVisibility = async (student: Student, field: 'parent_show_reports' | 'parent_show_calendar') => {
    const currentVal = (student as any)[field] !== false;
    const { error } = await (supabase.from('students') as any).update({ [field]: !currentVal }).eq('id', student.id);
    if (error) { toast.error('שגיאה בעדכון'); return; }
    toast.success(!currentVal ? 'הופעל להורה' : 'הוסתר מהורה');
    onRefresh();
  };

  const handleExportCodes = () => {
    const rows = [
      { סוג: 'מנהל', שם: 'מנהל', כיתה: '—', 'קוד כניסה': '9020', 'קוד הורה': '—' },
      { סוג: 'צוות', שם: 'צוות', כיתה: '—', 'קוד כניסה': '1001', 'קוד הורה': '—' },
      ...students.map(s => ({
        סוג: 'תלמיד',
        שם: `${s.first_name} ${s.last_name}`,
        כיתה: s.class_name || '—',
        'קוד כניסה': s.student_code,
        'קוד הורה': (s as any).parent_code || '—',
        פעיל: s.is_active ? 'כן' : 'לא',
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 6 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'קודים');
    const today = new Date().toISOString().split('T')[0];
    downloadWorkbook(wb, `קודי_כניסה_${today}.xlsx`);
    toast.success('הקובץ הורד בהצלחה');
  };

  return (
    <div className="space-y-4">
      {/* System codes */}
      <div>
        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          קודי מערכת
        </p>
        <div className="space-y-1.5">
          {[
            { label: 'מנהל', code: '9020', icon: Shield, color: 'text-primary' },
            { label: 'צוות', code: '1001', icon: Users, color: 'text-muted-foreground' },
          ].map(item => (
            <div key={item.code} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">{item.code}</Badge>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCopy(item.code)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student codes by class */}
      {['טלי', 'עדן'].map(cls => {
        const classStudents = students.filter(s => s.class_name === cls);
        if (classStudents.length === 0) return null;
        return (
          <div key={cls}>
            <p className="text-xs font-semibold mb-2">🏫 הכיתה של {cls}</p>
            <div className="space-y-1.5">
              {classStudents.map(s => {
                const parentCode = (s as any).parent_code || '';
                return (
                <div key={s.id} className={`flex flex-col gap-1.5 p-2.5 rounded-lg border bg-card transition-opacity ${!s.is_active ? 'opacity-40' : ''}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={s.is_active}
                        onCheckedChange={() => handleToggleActive(s)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  {/* Student code */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-md px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">קוד תלמיד:</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">{s.student_code}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(s.student_code)}>
                        <Copy className="h-2.5 w-2.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={regenerating === s.id} onClick={() => handleRegenerate(s)}>
                        <RefreshCw className={`h-2.5 w-2.5 ${regenerating === s.id ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  {/* Parent code */}
                  <div className="flex items-center justify-between bg-accent/30 rounded-md px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary/80">קוד הורה:</span>
                      <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">{parentCode || '—'}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {parentCode && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(parentCode)}>
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={regeneratingParent === s.id} onClick={() => handleRegenerateParent(s)}>
                        <RefreshCw className={`h-2.5 w-2.5 ${regeneratingParent === s.id ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  {/* Parent visibility toggles */}
                  {parentCode && (
                    <div className="flex items-center gap-3 px-2 py-1 bg-muted/30 rounded-md">
                      <span className="text-[10px] text-muted-foreground">הורה רואה:</span>
                      <button
                        onClick={() => handleToggleParentVisibility(s, 'parent_show_reports')}
                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          (s as any).parent_show_reports !== false ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(s as any).parent_show_reports !== false ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                        דיווחים
                      </button>
                      <button
                        onClick={() => handleToggleParentVisibility(s, 'parent_show_calendar')}
                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          (s as any).parent_show_calendar !== false ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(s as any).parent_show_calendar !== false ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                        מבחנים
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
