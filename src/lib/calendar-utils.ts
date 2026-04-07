export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface Note {
  id: string;
  date: Date | null;
  content: string;
  createdAt: Date;
}

export interface SelectedRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface MonthData {
  name: string;
  image: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const MONTHS: MonthData[] = [
  { name: 'January', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80', theme: { primary: '#1e3a5f', secondary: '#2d5a87', accent: '#4a90d9' } },
  { name: 'February', image: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=800&q=80', theme: { primary: '#5c3d2e', secondary: '#8b5a4a', accent: '#d4846c' } },
  { name: 'March', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', theme: { primary: '#3d5c3d', secondary: '#5a8b5a', accent: '#8bc48b' } },
  { name: 'April', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80', theme: { primary: '#5a3d6b', secondary: '#8b5a8b', accent: '#c48bc4' } },
  { name: 'May', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', theme: { primary: '#2d5a5a', secondary: '#4a8b8b', accent: '#6bc4c4' } },
  { name: 'June', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', theme: { primary: '#5a4d2d', secondary: '#8b7a4a', accent: '#c4a86c' } },
  { name: 'July', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', theme: { primary: '#2d4a5a', secondary: '#4a7a8b', accent: '#6caec4' } },
  { name: 'August', image: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&q=80', theme: { primary: '#5a2d3d', secondary: '#8b4a5a', accent: '#c46c7c' } },
  { name: 'September', image: 'https://images.unsplash.com/photo-1508780709619-7953c56638e5?w=800&q=80', theme: { primary: '#4a5a2d', secondary: '#7a8b4a', accent: '#aec46c' } },
  { name: 'October', image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d9?w=800&q=80', theme: { primary: '#6b4a2d', secondary: '#a87a4a', accent: '#d4a86c' } },
  { name: 'November', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', theme: { primary: '#3d4a5a', secondary: '#5a708b', accent: '#7a94b4' } },
  { name: 'December', image: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=800&q=80', theme: { primary: '#4a2d3d', secondary: '#7a4a5a', accent: '#a46c7c' } },
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HOLIDAYS: Record<number, { day: number; name: string }[]> = {
  0: [{ day: 1, name: "New Year's Day" }],
  1: [{ day: 26, name: 'Republic Day' }],
  6: [{ day: 15, name: 'Independence Day' }],
  8: [{ day: 2, name: 'Gandhi Jayanti' }],
  11: [{ day: 25, name: 'Christmas Day' }],
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const monthHolidays = HOLIDAYS[month] || [];
  
  const days: CalendarDay[] = [];
  
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
      isHoliday: false,
      holidayName: null,
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isToday = date.toDateString() === today.toDateString();
    const holiday = monthHolidays.find(h => h.day === i);
    days.push({
      date,
      day: i,
      isCurrentMonth: true,
      isToday,
      isHoliday: !!holiday,
      holidayName: holiday?.name || null,
    });
  }
  
  const remainingDays = 42 - days.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(nextYear, nextMonth, i),
      day: i,
      isCurrentMonth: false,
      isToday: false,
      isHoliday: false,
      holidayName: null,
    });
  }
  
  return days;
}

export function isSameDay(date1: Date, date2: Date | null): boolean {
  if (!date2) return false;
  return date1.toDateString() === date2.toDateString();
}

export function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
