import { useState } from 'react';
import { SpecialCode } from '@reset/types';
import { supabase } from '@reset/integrations/supabase/client';
import { ArrowRight, Key, Shield, ShieldOff, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  specialCodes: SpecialCode[];
  refreshSpecialCodes: () => Promise<void>;
  onBack: () => void;
}

export default function ManageSpecialCodes({ specialCodes, refreshSpecialCodes, onBack }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({});

  // Don't show dashboard code (9020) — it should always stay active
  const manageable = specialCodes.filter(sc => sc.role !== 'dashboard');

  const toggleActive = async (sc: SpecialCode) => {
    setSaving(sc.id);
    const { error } = await supabase
      .from('special_codes')
      .update({ active: !sc.active })
      .eq('id', sc.id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      toast.success(sc.active ? `קוד ${sc.code} הושבת` : `קוד ${sc.code} הופעל`);
      await refreshSpecialCodes();
    }
    setSaving(null);
  };

  const setExpiry = async (sc: SpecialCode) => {
    const days = parseInt(expiryInputs[sc.id] || '');
    if (!days || days < 1) {
      toast.error('יש להזין מספר ימים תקין');
      return;
    }
    setSaving(sc.id);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('special_codes')
      .update({ expires_at: expiresAt, active: true })
      .eq('id', sc.id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      toast.success(`קוד ${sc.code} יפוג בעוד ${days} ימים`);
      setExpiryInputs(prev => ({ ...prev, [sc.id]: '' }));
      await refreshSpecialCodes();
    }
    setSaving(null);
  };

  const clearExpiry = async (sc: SpecialCode) => {
    setSaving(sc.id);
    const { error } = await supabase
      .from('special_codes')
      .update({ expires_at: null })
      .eq('id', sc.id);

    if (error) {
      toast.error('שגיאה בעדכון');
    } else {
      toast.success(`תפוגה הוסרה מקוד ${sc.code}`);
      await refreshSpecialCodes();
    }
    setSaving(null);
  };

  const isExpired = (sc: SpecialCode) => sc.expiresAt && new Date(sc.expiresAt) < new Date();

  const roleLabels: Record<string, string> = {
    staff: '👁️ צפייה לצוות',
    parent: '👨‍👩‍👧 גישת הורים',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Key size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">ניהול קודים מיוחדים</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">הפעלה, השבתה והגדרת תפוגה לקודי גישה מיוחדים.</p>

      <div className="space-y-4">
        {manageable.map(sc => (
          <div key={sc.id} className={`card-reset p-4 border-r-4 ${sc.active && !isExpired(sc) ? 'border-r-primary' : 'border-r-destructive'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground" dir="ltr">{sc.code}</span>
                  <span className="text-sm text-muted-foreground">{roleLabels[sc.role] || sc.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {sc.active && !isExpired(sc) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">פעיל</span>
                  ) : isExpired(sc) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">פג תוקף</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">מושבת</span>
                  )}
                  {sc.expiresAt && !isExpired(sc) && (
                    <span className="text-xs text-muted-foreground">
                      תפוגה: {new Date(sc.expiresAt).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleActive(sc)}
                disabled={saving === sc.id}
                className={`flex items-center gap-1 text-sm py-2 px-3 rounded-xl ${
                  sc.active
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {sc.active ? <ShieldOff size={14} /> : <Shield size={14} />}
                {saving === sc.id ? '...' : sc.active ? 'השבת' : 'הפעל'}
              </button>
            </div>

            {/* Expiry controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar size={14} className="text-muted-foreground" />
              <input
                type="number"
                min="1"
                max="365"
                value={expiryInputs[sc.id] || ''}
                onChange={e => setExpiryInputs(prev => ({ ...prev, [sc.id]: e.target.value }))}
                placeholder="מספר ימים"
                className="w-28 rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => setExpiry(sc)}
                disabled={saving === sc.id}
                className="btn-secondary text-xs"
              >
                הגדר תפוגה
              </button>
              {sc.expiresAt && (
                <button
                  onClick={() => clearExpiry(sc)}
                  disabled={saving === sc.id}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  הסר תפוגה
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
