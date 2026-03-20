import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RefreshCw, Shield, Users, User, Copy } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

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
    else { toast.success(`קוד חדש נוצר: ${newCode}`); onRefresh(); }
    setRegenerating(null);
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
              {classStudents.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-lg border bg-card transition-opacity ${!s.is_active ? 'opacity-40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                    <Badge variant="secondary" className="font-mono text-[10px] mt-0.5">{s.student_code}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCopy(s.student_code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0"
                      disabled={regenerating === s.id}
                      onClick={() => handleRegenerate(s)}
                    >
                      <RefreshCw className={`h-3 w-3 ${regenerating === s.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={() => handleToggleActive(s)}
                      className="scale-75"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
