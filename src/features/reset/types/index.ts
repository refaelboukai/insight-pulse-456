export interface Student {
  id: string;
  name: string;
  nationalId: string;
  accessCode: string;
  className?: string;
  grade?: string;
  homeroomTeacher?: string;
  createdAt: string;
  lastLoginAt?: string;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  selectedState: string;
  intensityScore?: number;
  intensityLabel?: string;
  skillUsed?: string;
  skillHelpful?: boolean;
  resultAfterPractice?: string;
  supportRequested: boolean;
  adultContactName?: string;
  adultContactCategory?: string;
  optionalContextText?: string;
  timestamp: string;
  isPositiveReflection?: boolean;
  positiveSource?: string;
}

export interface StaffContact {
  name: string;
  category: string;
  whatsappUrl?: string;
}

export interface SkillStep {
  letter?: string;
  title: string;
  description: string;
  hasAnimation?: string;
}

export interface Skill {
  id: string;
  name: string;
  englishName?: string;
  acronymMeaning?: string;
  description: string;
  category: 'calming' | 'thinking' | 'communication' | 'acceptance';
  categoryLabel: string;
  estimatedTime: string;
  hasWritingMode?: boolean;
  steps?: SkillStep[];
}

export interface EmotionalState {
  id: string;
  label: string;
  icon: string;
  isPositive?: boolean;
  isSOS?: boolean;
}

export type UserRole = 'student' | 'staff' | 'dashboard' | 'parent';

export interface SpecialCode {
  id: string;
  code: string;
  label: string;
  role: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  student: Student | null;
}
