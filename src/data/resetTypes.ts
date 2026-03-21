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

export interface StaffContact {
  name: string;
  category: string;
  whatsappUrl?: string;
}
