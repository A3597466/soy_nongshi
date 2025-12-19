
export type ScheduleType = 'science' | 'reclamation' | 'local' | 'custom';

export interface FarmingTask {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  activity: string;
  notes?: string;
  type: ScheduleType;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  tasks: FarmingTask[];
}

export type ThemeMode = 'light' | 'dark';
export type ColorPalette = 'green' | 'orange';

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  science: '理论科学排期',
  reclamation: '农垦用户排期',
  local: '地方用户排期',
  custom: '用户自定义排期'
};

export const THEME_COLORS = {
  green: {
    primary: 'emerald-600',
    hover: 'emerald-700',
    light: 'emerald-50',
    border: 'emerald-200',
    bg: 'bg-emerald-600'
  },
  orange: {
    primary: 'orange-500',
    hover: 'orange-600',
    light: 'orange-50',
    border: 'orange-200',
    bg: 'bg-orange-500'
  }
};
