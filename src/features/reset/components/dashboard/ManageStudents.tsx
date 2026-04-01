import { useState } from 'react';
import { Student, ActivityLog } from '@reset/types';
import { Filter } from 'lucide-react';
import { supabase } from '@reset/integrations/supabase/client';
import { supabase as insightSupabase } from '@/integrations/supabase/client';
import { ArrowRight, Download, Users, Plus, Pencil, RefreshCw, X, Check, Search, Activity, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  students: Student[];
  activities: ActivityLog[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  refreshData: () => Promise<void>;
  onBack: () => void;
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface EditForm {
  name: string;
  nationalId: string;
  className: string;
  grade: string;
  homeroomTeacher: string;
}

export default function ManageStudents({ students, activities, setStudents, refreshData, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', nationalId: '', className: '', grade: '', homeroomTeacher: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState<EditForm>({ name: '', nationalId: '', className: '', grade: '', homeroomTeacher: '' });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'support' | 'lastLogin'>('name');

  const classes = (() => {
    const set = new Set(students.map(s => s.className || 'ללא כיתה'));
    return ['all', ...Array.from(set)];
  })();

  const filtered = (() => {
    let result = students.filter(s =>
      s.name.includes(search) || s.nationalId.includes(search) || s.accessCode.includes(search)
    );
    if (classFilter !== 'all') {
      result = result.filter(s => (s.className || 'ללא כיתה') === classFilter);
    }
    if (sortBy === 'support') {
      result.sort((a, b) => {
        const aCount = activities.filter(act => act.studentId === b.id && act.supportRequested).length;
        const bCount = activities.filter(act => act.studentId === a.id && act.supportRequested).length;
        return aCount - bCount;
      });
    } else if (sortBy === 'lastLogin') {
      result.sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
    }
    return result;
  })();

  // Activity status per student
  const getStatus = (s: Student) => {
    const sActs = activities.filter(a => a.studentId === s.id);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const hasSupport = sActs.some(a => a.supportRequested && new Date(a.timestamp).getTime() > weekAgo);
    const recentActs = sActs.filter(a => new Date(a.timestamp).getTime() > dayAgo);
    const weekActs = sActs.filter(a => new Date(a.timestamp).getTime() > weekAgo);

    if (hasSupport) return { label: 'בקשת עזרה', color: 'bg-destructive/10 text-destructive' };
    if (recentActs.length > 0) return { label: 'פעיל היום', color: 'bg-green-100 text-green-700' };
    if (weekActs.length > 0) return { label: 'פעיל השבוע', color: 'bg-blue-100 text-blue-700' };
    if (sActs.length > 0) return { label: 'לא פעיל', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'טרם השתמש', color: 'bg-secondary text-muted-foreground' };
  };

  const startEdit = (s: Student) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      nationalId: s.nationalId,
      className: s.className || '',
      grade: s.grade || '',
      homeroomTeacher: s.homeroomTeacher || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.name.trim() || !editForm.nationalId.trim()) {
      toast.error('שם ות.ז הם שדות חובה');
      return;
    }
    if (editForm.name.trim().length > 100 || editForm.nationalId.trim().length > 20) {
      toast.error('ערכים ארוכים מדי');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({
        name: editForm.name.trim(),
        national_id: editForm.nationalId.trim(),
        class_name: editForm.className.trim() || null,
        grade: editForm.grade.trim() || null,
        homeroom_teacher: editForm.homeroomTeacher.trim() || null,
      })
      .eq('id', editingId);

    if (error) {
      toast.error('שגיאה בשמירה');
    } else {
      toast.success('הפרטים עודכנו');
      await refreshData();
    }
    setSaving(false);
    setEditingId(null);
  };

  const resetAccessCode = async (studentId: string, studentName: string) => {
    const newCode = generateAccessCode();
    const { error } = await supabase
      .from('students')
      .update({ access_code: newCode })
      .eq('id', studentId);

    if (error) {
      toast.error('שגיאה באיפוס קוד');
    } else {
      toast.success(`קוד חדש ל${studentName}: ${newCode}`);
      await refreshData();
    }
  };

  const toggleActive = async (s: Student) => {
    const { error } = await supabase
      .from('students')
      .update({ active: !s.active })
      .eq('id', s.id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      setStudents(prev => prev.map(st => st.id === s.id ? { ...st, active: !st.active } : st));
      toast.success(s.active ? 'הקוד בוטל' : 'הקוד הופעל');
    }
  };

  const addStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.nationalId.trim()) {
      toast.error('שם ות.ז הם שדות חובה');
      return;
    }
    if (newStudent.name.trim().length > 100 || newStudent.nationalId.trim().length > 20) {
      toast.error('ערכים ארוכים מדי');
      return;
    }
    // Check duplicate national ID
    if (students.some(s => s.nationalId === newStudent.nationalId.trim())) {
      toast.error('ת.ז כבר קיימת במערכת');
      return;
    }

    setSaving(true);
    const accessCode = generateAccessCode();
    const { error } = await supabase
      .from('students')
      .insert({
        name: newStudent.name.trim(),
        national_id: newStudent.nationalId.trim(),
        access_code: accessCode,
        class_name: newStudent.className.trim() || null,
        grade: newStudent.grade.trim() || null,
        homeroom_teacher: newStudent.homeroomTeacher.trim() || null,
      });

    if (error) {
      toast.error('שגיאה בהוספת תלמיד');
    } else {
      toast.success(`${newStudent.name.trim()} נוסף/ה בהצלחה! קוד: ${accessCode}`);
      setNewStudent({ name: '', nationalId: '', className: '', grade: '', homeroomTeacher: '' });
      setShowAddForm(false);
      await refreshData();
    }
    setSaving(false);
  };

  const syncFromInsight = async () => {
    setSyncing(true);
    const { data: insightStudents, error } = await (insightSupabase.from('students') as any)
      .select('student_code, first_name, last_name, class_name, grade')
      .order('student_code');
    if (error || !insightStudents?.length) {
      toast.error('שגיאה בטעינת תלמידים מ-Insight');
      setSyncing(false);
      return;
    }
    let added = 0, skipped = 0;
    for (const s of insightStudents) {
      const code = (s.student_code as string).toUpperCase();
      const name = `${s.first_name} ${s.last_name}`.trim();
      const { error: upsertErr } = await supabase
        .from('students')
        .upsert(
          { name, access_code: code, class_name: s.class_name || null, grade: s.grade || null, active: true, national_id: code },
          { onConflict: 'access_code' }
        );
      if (upsertErr) skipped++; else added++;
    }
    toast.success(`סנכרון הושלם: ${added} תלמידים עודכנו, ${skipped} שגיאות`);
    await refreshData();
    setSyncing(false);
  };

  const exportCSV = () => {
    const rows = students.map(s => {
      const status = getStatus(s);
      return {
        שם: s.name, תז: s.nationalId, קוד: s.accessCode,
        כיתה: s.className || '', שכבה: s.grade || '',
        מחנכת: s.homeroomTeacher || '', פעיל: s.active ? 'כן' : 'לא',
        סטטוס: status.label,
      };
    });
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
  };

  return (
    <div className="bg-background p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(174,40%,90%)] flex items-center justify-center">
          <Users size={20} className="text-[hsl(174,42%,35%)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">ניהול תלמידים</h2>
          <p className="text-xs text-muted-foreground">{students.length} תלמידים רשומים</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm mb-5">
        <p className="text-xs font-bold text-muted-foreground mb-3">פעולות</p>
        <div className="flex gap-3 mb-4 flex-wrap">
          <button onClick={() => setShowAddForm(!showAddForm)} className="rounded-xl bg-primary text-primary-foreground py-2 px-4 text-sm font-semibold flex items-center gap-1">
            <Plus size={14} /> הוסף תלמיד
          </button>
          <button onClick={syncFromInsight} disabled={syncing} className="rounded-xl bg-secondary text-secondary-foreground py-2 px-4 text-sm font-semibold flex items-center gap-1 border border-primary/30 text-primary">
            <RefreshCcw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'מסנכרן...' : 'סנכרן מ-Insight'}
          </button>
          <button onClick={exportCSV} className="rounded-xl bg-secondary text-secondary-foreground py-2 px-4 text-sm font-semibold flex items-center gap-1">
            <Download size={14} /> ייצוא
          </button>
        </div>

        {/* Add student form */}
        {showAddForm && (
          <div className="rounded-xl border border-primary/20 bg-card p-4 mb-4">
            <h3 className="text-sm font-bold text-foreground mb-3">הוספת תלמיד/ה חדש/ה</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={newStudent.name}
              onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
              placeholder="שם מלא *"
              maxLength={100}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={newStudent.nationalId}
              onChange={e => setNewStudent(p => ({ ...p, nationalId: e.target.value }))}
              placeholder="תעודת זהות *"
              maxLength={20}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={newStudent.className}
              onChange={e => setNewStudent(p => ({ ...p, className: e.target.value }))}
              placeholder="כיתה"
              maxLength={20}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={newStudent.grade}
              onChange={e => setNewStudent(p => ({ ...p, grade: e.target.value }))}
              placeholder="שכבה"
              maxLength={20}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={newStudent.homeroomTeacher}
              onChange={e => setNewStudent(p => ({ ...p, homeroomTeacher: e.target.value }))}
              placeholder="מחנכ/ת"
              maxLength={100}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addStudent} disabled={saving} className="rounded-xl bg-primary text-primary-foreground py-2 px-4 text-sm font-semibold flex items-center gap-1">
              <Check size={14} /> {saving ? 'שומר...' : 'הוסף'}
            </button>
            <button onClick={() => setShowAddForm(false)} className="rounded-xl bg-secondary text-secondary-foreground py-2 px-4 text-sm font-semibold flex items-center gap-1">
              <X size={14} /> ביטול
            </button>
          </div>
        </div>
      )}

      {/* Class filter */}
      {classes.length > 2 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Filter size={14} className="text-muted-foreground mt-1" />
          {classes.map(c => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={`text-xs py-1 px-3 rounded-lg ${classFilter === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {c === 'all' ? 'כל הכיתות' : c}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, ת.ז או קוד..."
          className="w-full rounded-xl border border-input bg-card pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'name' as const, label: 'שם' },
          { key: 'support' as const, label: 'בקשות עזרה' },
          { key: 'lastLogin' as const, label: 'כניסה אחרונה' },
        ].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className={`text-xs py-1 px-3 rounded-lg ${sortBy === s.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {filtered.map(s => {
          const status = getStatus(s);
          const isEditing = editingId === s.id;

          if (isEditing) {
            return (
              <div key={s.id} className="card-reset p-4 border border-primary/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground">שם</label>
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      maxLength={100} className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">ת.ז</label>
                    <input value={editForm.nationalId} onChange={e => setEditForm(p => ({ ...p, nationalId: e.target.value }))}
                      maxLength={20} className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">כיתה</label>
                    <input value={editForm.className} onChange={e => setEditForm(p => ({ ...p, className: e.target.value }))}
                      maxLength={20} className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">שכבה</label>
                    <input value={editForm.grade} onChange={e => setEditForm(p => ({ ...p, grade: e.target.value }))}
                      maxLength={20} className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground">מחנכ/ת</label>
                    <input value={editForm.homeroomTeacher} onChange={e => setEditForm(p => ({ ...p, homeroomTeacher: e.target.value }))}
                      maxLength={100} className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs flex items-center gap-1">
                    <Check size={12} /> {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-xs flex items-center gap-1">
                    <X size={12} /> ביטול
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={s.id} className="card-reset p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    {!s.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">מושבת</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.nationalId} | <span dir="ltr">{s.accessCode}</span>
                    {s.className && ` | ${s.className}`}
                    {s.homeroomTeacher && ` | ${s.homeroomTeacher}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="עריכה">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => resetAccessCode(s.id, s.name)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" title="איפוס קוד">
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-xs py-1 px-2 rounded-lg ${s.active ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {s.active ? 'השבת' : 'הפעל'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
