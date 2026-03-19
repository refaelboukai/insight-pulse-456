import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { INCIDENT_TYPE_LABELS } from '@/lib/constants';
import { AlertTriangle, Send } from 'lucide-react';
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
      toast.success('האירוע החריג נשמר בהצלחה');
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
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-accent" />
            דיווח אירוע חריג
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">סוג אירוע</label>
            <Select value={incidentType} onValueChange={v => setIncidentType(v as IncidentType)}>
              <SelectTrigger>
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
            <label className="text-sm font-medium mb-1 block">תיאור האירוע</label>
            <Textarea
              placeholder="תאר/י את האירוע..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">מעורבים</label>
            <Textarea
              placeholder="שמות המעורבים..."
              value={peopleInvolved}
              onChange={e => setPeopleInvolved(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">תגובת הצוות</label>
            <Textarea
              placeholder="מה נעשה בתגובה לאירוע..."
              value={staffResponse}
              onChange={e => setStaffResponse(e.target.value)}
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
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
            />
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            <Send className="ml-2 h-4 w-4" />
            {submitting ? 'שומר...' : 'שלח דיווח אירוע'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
