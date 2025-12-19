
export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getCalendarGrid = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
  
  const days: Date[] = [];
  
  // Fill previous month padding
  const prevMonth = new Date(year, month, 0);
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonth.getDate() - i));
  }
  
  // Current month
  const currentMonthDays = getDaysInMonth(year, month);
  days.push(...currentMonthDays);
  
  // Fill next month padding
  const totalCells = 42; // 6 rows * 7 columns
  const remaining = totalCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
};

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseTxtData = (content: string, type: any): any[] => {
  const lines = content.split('\n');
  return lines
    .map((line, idx) => {
      if (line.trim() === "" || line.includes("开始日期")) return null;
      const parts = line.split('|');
      if (parts.length < 3) return null;
      // Format: StartDate|EndDate|Activity|Notes
      return {
        id: `${type}-${idx}-${Date.now()}`,
        startDate: parts[0].trim(),
        endDate: parts[1].trim(),
        activity: parts[2].trim(),
        notes: parts[3]?.trim() || '',
        type
      };
    })
    .filter(Boolean);
};
