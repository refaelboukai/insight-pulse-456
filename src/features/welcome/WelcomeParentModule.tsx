/**
 * WelcomeParentModule - embeds the Welcome parent questionnaire inside Insight.
 * Looks up the intake session using the parent code (which is the parent's login code in Insight).
 */
import { useState, useEffect } from 'react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { welcomeSupabase } from './supabase';
import ParentFlow from '@welcome/pages/ParentFlow';
import { Loader2, ClipboardCheck } from 'lucide-react';

interface Props {
  /** The parent code used to log in (or the student code linked to the parent) */
  parentCode: string;
}

export default function WelcomeParentModule({ parentCode }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const code = parentCode.trim().toUpperCase();
    // Try matching by parent_code first, fallback to student_code
    welcomeSupabase
      .from('intake_sessions')
      .select('id')
      .eq('parent_code', code)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setSessionId(data.id);
          setLoading(false);
          return;
        }
        // Fallback: try student_code (for parents using the student code)
        const { data: byStudent } = await welcomeSupabase
          .from('intake_sessions')
          .select('id')
          .eq('student_code', code)
          .maybeSingle();
        if (byStudent) {
          setSessionId(byStudent.id);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [parentCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">לא נמצא שאלון Welcome עבור ילד זה.</p>
        <p className="text-xs text-muted-foreground/60">ניתן לפנות למנהל המערכת.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-background" style={{ minHeight: '400px' }}>
      <MemoryRouter initialEntries={[`/parent/${sessionId}`]}>
        <Routes>
          <Route path="/parent/:sessionId" element={<ParentFlow />} />
          <Route path="*" element={<Navigate to={`/parent/${sessionId}`} replace />} />
        </Routes>
      </MemoryRouter>
    </div>
  );
}
