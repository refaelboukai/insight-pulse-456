import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ResetCalmZone() {
  const { lockedStudentId } = useAuth();
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lockedStudentId) {
      setLoading(false);
      return;
    }
    supabase
      .from('students')
      .select('student_code')
      .eq('id', lockedStudentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStudentCode(data.student_code);
        setLoading(false);
      });
  }, [lockedStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentCode) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">לא נמצא תלמיד משויך.</p>
      </div>
    );
  }

  const resetUrl = `https://reset-calm-zone.lovable.app/?auto_login=${studentCode}`;

  return (
    <div className="rounded-2xl overflow-hidden border bg-card shadow-soft" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
      <iframe
        src={resetUrl}
        className="w-full h-full border-0"
        allow="autoplay; microphone"
        title="Reset Calm Zone"
      />
    </div>
  );
}
