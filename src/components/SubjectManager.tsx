import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';

type ManagedSubject = { id: string; name: string; has_sub_subjects: boolean; sub_subjects: string[]; is_active: boolean };

export default function SubjectManager() {
  const [subjects, setSubjects] = useState<ManagedSubject[]>([]);
  const [newName, setNewName] = useState('');
  const [newSubSubject, setNewSubSubject] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('managed_subjects').select('*').order('name');
    if (data) setSubjects(data as ManagedSubject[]);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('managed_subjects').insert({ name: newName.trim() });
    if (error) toast.error('שגיאה: ' + error.message);
    else { toast.success('מקצוע נוסף'); setNewName(''); load(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('managed_subjects').update({ is_active: !current }).eq('id', id);
    load();
  };

  const toggleSubSubjects = async (id: string, current: boolean) => {
    await supabase.from('managed_subjects').update({ has_sub_subjects: !current }).eq('id', id);
    load();
  };

  const addSubSubject = async (id: string) => {
    const val = newSubSubject[id]?.trim();
    if (!val) return;
    const subj = subjects.find(s => s.id === id);
    if (!subj) return;
    const updated = [...(subj.sub_subjects || []), val];
    await supabase.from('managed_subjects').update({ sub_subjects: updated, has_sub_subjects: true }).eq('id', id);
    setNewSubSubject(prev => ({ ...prev, [id]: '' }));
    load();
  };

  const removeSubSubject = async (id: string, ss: string) => {
    const subj = subjects.find(s => s.id === id);
    if (!subj) return;
    const updated = subj.sub_subjects.filter(s => s !== ss);
    await supabase.from('managed_subjects').update({ sub_subjects: updated, has_sub_subjects: updated.length > 0 }).eq('id', id);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('managed_subjects').delete().eq('id', id);
    if (error) toast.error('לא ניתן למחוק מקצוע שיש לו יעדים פדגוגיים');
    else load();
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          ניהול מקצועות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input className="h-8 text-sm flex-1" placeholder="שם מקצוע חדש..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <Button size="sm" onClick={handleAdd} className="gap-1 h-8"><Plus className="h-3.5 w-3.5" />הוסף</Button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {subjects.map(subj => (
            <div key={subj.id} className={`border rounded-lg p-2 space-y-1.5 ${!subj.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{subj.name}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">פעיל</Label>
                  <Switch checked={subj.is_active} onCheckedChange={() => toggleActive(subj.id, subj.is_active)} />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(subj.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              {/* Sub-subjects */}
              <div className="flex flex-wrap gap-1">
                {subj.sub_subjects?.map(ss => (
                  <Badge key={ss} variant="secondary" className="text-xs gap-1">
                    {ss}
                    <button onClick={() => removeSubSubject(subj.id, ss)}><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1">
                <Input className="h-7 text-xs flex-1" placeholder="הוסף תת-מקצוע..." value={newSubSubject[subj.id] || ''} onChange={e => setNewSubSubject(prev => ({ ...prev, [subj.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubSubject(subj.id)} />
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addSubSubject(subj.id)}>+</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
