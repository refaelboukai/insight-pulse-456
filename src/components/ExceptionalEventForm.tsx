import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { INCIDENT_TYPE_LABELS, VIOLENCE_LABELS } from '@/lib/constants';
import { generateEventPdf } from '@/lib/generateEventPdf';
import { Send, FileWarning, MessageCircle, Users, Shield, X, Sparkles, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type IncidentType = Database['public']['Enums']['incident_type'];
type Student = Database['public']['Tables']['students']['Row'];


export default function ExceptionalEventForm() {
  const { user } = useAuth();
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [violenceSubtypes, setViolenceSubtypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffResponse, setStaffResponse] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupNotes, setFollowupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formattingField, setFormattingField] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string }[]>([]);
  

  useEffect(() => {
    const load = async () => {
      const [sRes, stRes, subjRes] = await Promise.all([
        supabase.from('students').select('*').eq('is_active', true).order('class_name').order('last_name'),
        supabase.from('staff_members').select('id, name').eq('is_active', true).order('name'),
        supabase.from('managed_subjects').select('id, name').eq('is_active', true).order('name'),
      ]);
      if (sRes.data) setStudents(sRes.data);
      if (stRes.data) setStaffMembers(stRes.data as any[]);
      if (subjRes.data) setManagedSubjects(subjRes.data as any[]);
    };
    load();
  }, []);

  const buildPeopleInvolvedText = () => {
    const parts: string[] = [];
    if (selectedStudents.length > 0) {
      const names = selectedStudents.map(id => {
        const s = students.find(st => st.id === id);
        return s ? `${s.first_name} ${s.last_name}` : '';
      }).filter(Boolean);
      parts.push(`תלמידים: ${names.join(', ')}`);
    }
    if (selectedStaff.length > 0) {
      const names = selectedStaff.map(id => {
        const sm = staffMembers.find(s => s.id === id);
        return sm ? sm.name : '';
      }).filter(Boolean);
      parts.push(`צוות: ${names.join(', ')}`);
    }
    return parts.join(' | ');
  };

  const buildFullDescription = () => {
    const parts: string[] = [];
    if (incidentType === 'violence' && violenceSubtypes.length > 0) {
      const subtypeNames = violenceSubtypes.map(v => VIOLENCE_LABELS[v] || v).join(', ');
      parts.push(`סוג אלימות: ${subtypeNames}`);
    }
    if (eventLocation) parts.push(`מיקום האירוע: ${eventLocation}`);
    if (lessonSubject) parts.push(`סוג השיעור: ${lessonSubject}`);
    if (staffPresent) parts.push(`צוות נוכח/אמור היה לנכוח: ${staffPresent}`);
    if (description) parts.push(`\n${description}`);
    if (additionalInfo) parts.push(`\nמידע נוסף: ${additionalInfo}`);
    return parts.join('\n');
  };

  const getEventData = () => {
    const now = new Date();
    return {
      incidentType,
      description: buildFullDescription(),
      peopleInvolved: buildPeopleInvolvedText(),
      staffResponse,
      followupRequired,
      followupNotes,
      date: now.toLocaleDateString('he-IL'),
      time: now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const validateForm = () => {
    if (!incidentType || !description || !user) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setIncidentType('');
    setViolenceSubtypes([]);
    setDescription('');
    setEventLocation('');
    setLessonSubject('');
    setStaffPresent('');
    setAdditionalInfo('');
    setSelectedStudents([]);
    setSelectedStaff([]);
    setStaffResponse('');
    setFollowupRequired(false);
    setFollowupNotes('');
  };

  const toggleViolenceSubtype = (v: string) => {
    setViolenceSubtypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleStaffMember = (id: string) => {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAiFormat = async (fieldType: string) => {
    const textMap: Record<string, string> = {
      description: description,
      staffResponse: staffResponse,
      followupNotes: followupNotes,
    };
    const text = textMap[fieldType];
    if (!text || text.trim().length < 10) {
      toast.error('נא להזין טקסט ארוך יותר לפני שיפור');
      return;
    }
    setFormattingField(fieldType);
    try {
      const { data, error } = await supabase.functions.invoke('format-event-text', {
        body: { text, fieldType },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.formatted) {
        const setterMap: Record<string, (v: string) => void> = {
          description: setDescription,
          staffResponse: setStaffResponse,
          followupNotes: setFollowupNotes,
        };
        setterMap[fieldType](data.formatted);
        toast.success('הטקסט עוצב בהצלחה');
      }
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בשיפור הטקסט');
    } finally {
      setFormattingField(null);
    }
  };

  const handleReport = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const peopleInvolved = buildPeopleInvolvedText();

      const { error } = await supabase.from('exceptional_events').insert({
        reported_by: user!.id,
        incident_type: incidentType as IncidentType,
        description: buildFullDescription(),
        people_involved: peopleInvolved || null,
        staff_response: staffResponse || null,
        followup_required: followupRequired,
        followup_notes: followupNotes || null,
        violence_subtypes: incidentType === 'violence' ? violenceSubtypes : [],
      } as any);

      if (error) {
        toast.error('שגיאה בשמירת האירוע');
        console.error(error);
        setSubmitting(false);
        return;
      }

      toast.success('האירוע נשמר בדשבורד בהצלחה ✨');

      const eventData = getEventData();
      const blob = await generateEventPdf(eventData);
      const typeName = INCIDENT_TYPE_LABELS[eventData.incidentType] || eventData.incidentType;
      const fileName = `אירוע-חריג-${eventData.date}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `דיווח אירוע חריג - ${typeName}`,
          text: `אירוע חריג: ${typeName}\n${eventData.description}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.info('הדוח הורד — ניתן לשתף דרך וואטסאפ או מייל');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה ביצירת הדוח');
    }
    setSubmitting(false);
  };

  const classTali = students.filter(s => s.class_name === 'טלי');
  const classEden = students.filter(s => s.class_name === 'עדן');

  const selectedStudentCount = (group: Student[]) =>
    group.filter(s => selectedStudents.includes(s.id)).length;
  const selectedStaffCount = staffMembers.filter(sm => selectedStaff.includes(sm.id)).length;

  const AiFormatButton = ({ fieldType, disabled }: { fieldType: string; disabled?: boolean }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => handleAiFormat(fieldType)}
      disabled={formattingField === fieldType || disabled}
      className="text-xs gap-1 h-7 px-2 text-muted-foreground hover:text-primary"
    >
      {formattingField === fieldType ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      שיפור עיצוב AI
    </Button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card-styled rounded-2xl overflow-hidden animate-slide-up">
        <div className="h-1 w-full" style={{ background: 'var(--gradient-accent)' }} />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileWarning className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-semibold text-base">דיווח אירוע חריג</h3>
          </div>

          <div>
            <label className="text-sm font-bold block text-muted-foreground">סוג אירוע</label>
            <Select value={incidentType} onValueChange={v => { setIncidentType(v as IncidentType); if (v !== 'violence') setViolenceSubtypes([]); }}>
              <SelectTrigger className="rounded-xl h-11 border-2">
                <SelectValue placeholder="בחר/י סוג אירוע" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INCIDENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {incidentType === 'violence' && (
            <div className="space-y-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <label className="text-sm font-bold block text-destructive">סוג האלימות</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(VIOLENCE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleViolenceSubtype(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      violenceSubtypes.includes(key)
                        ? 'bg-destructive text-destructive-foreground shadow-sm'
                        : 'bg-background border border-border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Event context fields */}
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-bold text-muted-foreground">הקשר האירוע</label>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">האירוע התרחש</label>
              <Select value={eventLocation} onValueChange={setEventLocation}>
                <SelectTrigger className="rounded-xl h-10 border-2 text-sm">
                  <SelectValue placeholder="בחר/י מיקום" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_LOCATIONS.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">סוג השיעור שבו התלמיד היה אמור להיות</label>
              <Select value={lessonSubject} onValueChange={setLessonSubject}>
                <SelectTrigger className="rounded-xl h-10 border-2 text-sm">
                  <SelectValue placeholder="בחר/י מקצוע" />
                </SelectTrigger>
                <SelectContent>
                  {managedSubjects.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">צוות שהיה נוכח או אמור היה לנכוח</label>
              <Input
                placeholder="שם/ות אנשי הצוות..."
                value={staffPresent}
                onChange={e => setStaffPresent(e.target.value)}
                className="rounded-xl border-2 h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">מידע רלוונטי נוסף</label>
              <Textarea
                placeholder="כל מידע נוסף הרלוונטי לאירוע..."
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                rows={2}
                className="rounded-xl border-2 resize-none text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                תיאור האירוע
              </label>
              <AiFormatButton fieldType="description" disabled={!description || description.length < 10} />
            </div>
            <Textarea
              placeholder="תאר/י את האירוע..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="rounded-xl border-2 resize-none"
              required
            />
          </div>

          {/* People involved - accordion selection */}
          <div>
            <label className="text-sm font-bold mb-2 flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              מעורבים
            </label>

            {/* Selected badges */}
            {(selectedStudents.length > 0 || selectedStaff.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedStudents.map(id => {
                  const s = students.find(st => st.id === id);
                  if (!s) return null;
                  return (
                    <Badge key={id} variant="secondary" className="text-sm px-2.5 py-1 gap-1">
                      {s.first_name} {s.last_name}
                      <button onClick={() => toggleStudent(id)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {selectedStaff.map(id => {
                  const sm = staffMembers.find(s => s.id === id);
                  if (!sm) return null;
                  return (
                    <Badge key={id} variant="outline" className="text-sm px-2.5 py-1 gap-1 border-primary/30 text-primary">
                      {sm.name}
                      <button onClick={() => toggleStaffMember(id)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <Accordion type="multiple" className="rounded-xl border-2 overflow-hidden">
              <AccordionItem value="eden" className="border-b">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    הכיתה של עדן
                    {selectedStudentCount(classEden) > 0 && (
                      <Badge variant="secondary" className="text-xs">{selectedStudentCount(classEden)}</Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {classEden.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={`text-sm py-1.5 px-3 rounded-lg border transition-all ${
                          selectedStudents.includes(s.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                        }`}
                      >
                        {s.first_name} {s.last_name}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tali" className="border-b">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    הכיתה של טלי
                    {selectedStudentCount(classTali) > 0 && (
                      <Badge variant="secondary" className="text-xs">{selectedStudentCount(classTali)}</Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {classTali.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={`text-sm py-1.5 px-3 rounded-lg border transition-all ${
                          selectedStudents.includes(s.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                        }`}
                      >
                        {s.first_name} {s.last_name}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="staff" className="border-0">
                <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    צוות מעורב
                    {selectedStaffCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{selectedStaffCount}</Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {staffMembers.map(sm => (
                      <button
                        key={sm.id}
                        type="button"
                        onClick={() => toggleStaffMember(sm.id)}
                        className={`text-sm py-1.5 px-3 rounded-lg border transition-all ${
                          selectedStaff.includes(sm.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                        }`}
                      >
                        {sm.name}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold flex items-center gap-1.5 text-muted-foreground">
                <Shield className="w-4 h-4" />
                תגובת הצוות
              </label>
              <AiFormatButton fieldType="staffResponse" disabled={!staffResponse || staffResponse.length < 10} />
            </div>
            <Textarea
              placeholder="מה נעשה בתגובה לאירוע..."
              value={staffResponse}
              onChange={e => setStaffResponse(e.target.value)}
              rows={2}
              className="rounded-xl border-2 resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border-2 border-transparent hover:border-accent/30 transition-colors">
            <Checkbox
              checked={followupRequired}
              onCheckedChange={v => setFollowupRequired(!!v)}
            />
            <span className="text-sm font-medium">נדרש מעקב</span>
          </label>

          {followupRequired && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-muted-foreground">הערות למעקב</label>
                <AiFormatButton fieldType="followupNotes" disabled={!followupNotes || followupNotes.length < 10} />
              </div>
              <Textarea
                placeholder="הערות למעקב..."
                value={followupNotes}
                onChange={e => setFollowupNotes(e.target.value)}
                rows={2}
                className="rounded-xl border-2 resize-none animate-fade-in"
              />
            </div>
          )}

          <Button
            onClick={handleReport}
            disabled={submitting}
            className="w-full h-12 text-base font-semibold rounded-xl border-0"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send className="ml-2 h-4 w-4" />
            {submitting ? 'שומר...' : 'דיווח'}
          </Button>
        </div>
      </div>
    </div>
  );
}
