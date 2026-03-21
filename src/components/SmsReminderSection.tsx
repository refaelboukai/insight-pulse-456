import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, CheckCheck } from 'lucide-react';

const STAFF_CONTACTS = [
  { name: 'רפאל בוקעי', phone: '0507622284' },
  { name: 'זהבית צמח', phone: '0507281873' },
  { name: 'יהודית אהרוני', phone: '0502050314' },
  { name: 'עדן כהן', phone: '0528027059' },
  { name: 'טלי עדרי', phone: '0545258258' },
  { name: 'נתלי חיים', phone: '0544321341' },
  { name: 'דניאל פרג\'י', phone: '0503848498' },
  { name: 'מור טנזי', phone: '0526682028' },
  { name: 'טדלה קסה', phone: '0546908079' },
  { name: 'תהל שלום', phone: '0526521333' },
  { name: 'נטליה קוצ\'מרוב', phone: '0544916172' },
  { name: 'הדס לוי', phone: '0583258963' },
  { name: 'נטלי מכלוף', phone: '0547262062' },
  { name: 'מירב פרג\'ון', phone: '0509350046' },
  { name: 'הדס טנגר ספז', phone: '0527204817' },
  { name: 'טל טפר', phone: '0523736949' },
  { name: 'ליאור נעמן', phone: '0525646610' },
];

export default function SmsReminderSection() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(STAFF_CONTACTS.map(c => c.phone)));

  const allSelected = selected.size === STAFF_CONTACTS.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(STAFF_CONTACTS.map(c => c.phone)));
  };

  const toggle = (phone: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const sendSms = () => {
    const phones = Array.from(selected);
    if (phones.length === 0) return;
    const message = 'שלום, תזכורת למלא דיווחים יומיים במערכת InsightPulse. תודה!';
    const smsUrl = `sms:${phones.join(',')}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <MessageSquare className="h-4 w-4" />
        שלח תזכורת SMS לצוות
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold">בחר נמענים</p>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={toggleAll}>
          <CheckCheck className="h-3 w-3" />
          {allSelected ? 'נקה הכל' : 'סמן הכל'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
        {STAFF_CONTACTS.map(c => (
          <label
            key={c.phone}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
              selected.has(c.phone) ? 'bg-primary/10' : 'hover:bg-muted/50'
            }`}
          >
            <Checkbox
              checked={selected.has(c.phone)}
              onCheckedChange={() => toggle(c.phone)}
              className="h-4 w-4"
            />
            <span className="truncate">{c.name}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 gap-1.5" size="sm" disabled={selected.size === 0} onClick={sendSms}>
          <MessageSquare className="h-3.5 w-3.5" />
          שלח ({selected.size})
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
