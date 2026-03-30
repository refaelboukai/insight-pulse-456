/**
 * WelcomeStudentModule - embeds the Welcome student questionnaire inside Insight.
 * Looks up the student's intake session using their student code.
 */
import { useState, useEffect } from 'react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { welcomeSupabase } from './supabase';
import StudentFlow from '@welcome/pages/StudentFlow';
import { Loader2, ClipboardCheck } from 'lucide-react';

interface Props {
  /** The student's access code from Insight */
  studentCode: string;
}

export default function WelcomeStudentModule({ studentCode }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const code = studentCode.trim().toUpperCase();
    welcomeSupabase
      .from('intake_sessions')
      .select('id, student_code_active')
      .eq('student_code', code)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSessionId(data.id);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [studentCode]);

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
        <p className="text-sm text-muted-foreground">לא נמצא שאלון Welcome עבור תלמיד זה.</p>
        <p className="text-xs text-muted-foreground/60">ניתן לפנות למנהל המערכת ליצירת שאלון.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-background" style={{ minHeight: '500px' }}>
      <MemoryRouter initialEntries={[`/student/${sessionId}`]}>
        <Routes>
          <Route path="/student/:sessionId" element={<StudentFlow />} />
          <Route path="*" element={<Navigate to={`/student/${sessionId}`} replace />} />
        </Routes>
      </MemoryRouter>
    </div>
  );
}
