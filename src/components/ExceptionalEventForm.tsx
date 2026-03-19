import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { INCIDENT_TYPE_LABELS } from '@/lib/constants';
import { AlertTriangle, Send, FileWarning, MessageCircle, Users, Shield } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type IncidentType = Database['public']['Enums']['incident_type'];

export default function ExceptionalEventForm() {
  const { user } = useAuth();
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [description, setDescription] = useState('');
  const [peopleInvolved, setPeopleInvolved] = useState('');
  const [staffResponse, setStaffResponse] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupNotes, setFollowupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!incidentType || !description || !user) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('exceptional_events').insert({
      reported_by: user.id,
      incident_type: incidentType as IncidentType,
      description,
      people_involved: peopleInvolved || null,
      staff_response: staffResponse || null,
      followup_required: followupRequired,
      followup_notes: followupNotes || null,
    });

    if (error) {
      toast.error('שגיאה בשמירת האירוע');
      console.error(error);
    } else {
      toast.success('האירוע החריג נשמר בהצלחה ✨');
      setIncidentType('');
      setDescription('');
      setPeopleInvolved('');
      setStaffResponse('');
      setFollowupRequired(false);
      setFollowupNotes('');
    }
    setSubmitting(false);
  };

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
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">סוג אירוע</label>
            <Select value={incidentType} onValueChange={v => setIncidentType(v as IncidentType)}>
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

          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              תיאור האירוע
            </label>
            <Textarea
              placeholder="תאר/י את האירוע..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="rounded-xl border-2 resize-none"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              מעורבים
            </label>
            <Textarea
              placeholder="שמות המעורבים..."
              value={peopleInvolved}
              onChange={e => setPeopleInvolved(e.target.value)}
              rows={2}
              className="rounded-xl border-2 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              תגובת הצוות
            </label>
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
            <Textarea
              placeholder="הערות למעקב..."
              value={followupNotes}
              onChange={e => setFollowupNotes(e.target.value)}
              rows={2}
              className="rounded-xl border-2 resize-none animate-fade-in"
            />
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 text-base font-semibold rounded-xl border-0"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Send className="ml-2 h-4 w-4" />
            {submitting ? 'שומר...' : 'שלח דיווח אירוע'}
          </Button>
        </div>
      </div>
    </div>
  );
}
