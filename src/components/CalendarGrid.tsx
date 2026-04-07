'use client';

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDay, WEEKDAYS, isSameDay, isInRange } from '@/lib/calendar-utils';

interface CalendarGridProps {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelectStart: (date: Date) => void;
  onSelectEnd: (date: Date | null) => void;
  onMonthChange?: (year: number, month: number) => void;
  containerOpacity?: number;
}

// Memoize to prevent unnecessary re-renders
const CalendarGrid = memo(function CalendarGrid({
  year,
  month,
  days,
  selectedStart,
  selectedEnd,
  onSelectStart,
  onSelectEnd,
  onMonthChange,
  containerOpacity = 20
}: CalendarGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [showHoliday, setShowHoliday] = useState<{ name: string | null; position: { x: number; y: number } } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleDayClick = useCallback((day: CalendarDay) => {
    if (day.isHoliday && day.isCurrentMonth && day.holidayName) {
      setShowHoliday({ name: day.holidayName, position: { x: 0, y: 0 } });
      setTimeout(() => setShowHoliday(null), 2000);
    }
    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelectStart(day.date);
      onSelectEnd(null);
    } else {
      if (day.date < selectedStart) {
        onSelectStart(day.date);
      } else {
        onSelectEnd(day.date);
      }
    }
  }, [selectedStart, selectedEnd, onSelectStart, onSelectEnd]);

  const handleDayHover = useCallback((day: CalendarDay | null) => {
    setHoverDate(day?.date || null);
  }, []);

  const getEffectiveEndDate = useCallback(() => {
    if (selectedStart && !selectedEnd && hoverDate) {
      return hoverDate > selectedStart ? hoverDate : selectedEnd;
    }
    return selectedEnd;
  }, [selectedStart, selectedEnd, hoverDate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === -1 || focusedIndex >= days.length) return;
      
      let newIndex = focusedIndex;
      const cols = 7;
      
      switch (e.key) {
        case 'ArrowRight':
          newIndex = Math.min(focusedIndex + 1, days.length - 1);
          break;
        case 'ArrowLeft':
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          newIndex = Math.min(focusedIndex + cols, days.length - 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(focusedIndex - cols, 0);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleDayClick(days[focusedIndex]);
          return;
        default:
          return;
      }
      
      e.preventDefault();
      setFocusedIndex(newIndex);
      
      if (newIndex >= 0 && newIndex < days.length) {
        setHoverDate(days[newIndex].date);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, days, handleDayClick]);

  // Infinite scroll - detect when user scrolls near bottom and load more months
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // When within 50px of bottom, consider user at bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      
      if (atBottom && onMonthChange) {
        // Load next month when scrolled to bottom
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        onMonthChange(nextYear, nextMonth);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [year, month, onMonthChange]);

  const isDarkText = containerOpacity >= 100;
  const textColor = isDarkText ? 'text-black' : 'text-white';
  const textColorSecondary = isDarkText ? 'text-black/60' : 'text-white/60';
  const textColorMuted = isDarkText ? 'text-black/30' : 'text-white/20';
  const textColorHighlight = isDarkText ? 'text-yellow-700' : 'text-yellow-200';
  const rangeBgColor = isDarkText ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
  const selectedBgColor = isDarkText ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';

  return (
    <div ref={containerRef} className="glass-calendar max-h-[400px] overflow-y-auto">
      {/* Holiday popup - moved to top */}
      <AnimatePresence>
        {showHoliday && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`fixed px-3 py-1.5 bg-yellow-400/90 backdrop-blur-sm rounded-lg text-xs font-medium shadow-lg z-50 ${isDarkText ? 'text-black' : 'text-black'}`}
            style={{
              left: showHoliday.position.x,
              top: 20,
              transform: 'translateX(-50%)',
            }}
          >
            {showHoliday.name}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Weekday headers */}
      <div className={`grid grid-cols-7 mb-2 sticky top-0 z-10 ${isDarkText ? 'bg-[#d4e8d4]' : 'bg-[#1a2e1a]'}`}>
        {WEEKDAYS.map((day) => (
          <div 
            key={day} 
            className={`text-center text-xs font-medium py-2 ${textColorSecondary}`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isStart = isSameDay(day.date, selectedStart);
          const isEnd = isSameDay(day.date, getEffectiveEndDate());
          const inRange = isInRange(day.date, selectedStart, getEffectiveEndDate());
          
          const isSelected = isStart || isEnd;
          const isInRangeBg = inRange && !isStart && !isEnd;
          const isFocused = index === focusedIndex;
          
          const dateLabel = new Date(year, month, day.day).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          return (
            <motion.button
              key={`${year}-${month}-${index}`}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => {
                handleDayHover(day);
                setFocusedIndex(index);
              }}
              onMouseLeave={() => handleDayHover(null)}
              whileTap={{ scale: 0.9 }}
              aria-label={dateLabel}
              aria-selected={isSelected}
              aria-current={day.isToday ? 'date' : undefined}
              className={`
                calendar-date relative aspect-square flex items-center justify-center flex-col
                text-sm font-medium transition-all duration-300 rounded-lg outline-none
                ${!day.isCurrentMonth ? textColorMuted : textColor}
                ${isSelected ? `${textColor} calendar-date-selected` : ''}
                ${isInRangeBg ? textColor : ''}
                ${isFocused ? 'ring-2 ring-white/50' : ''}
                ${day.isHoliday && day.isCurrentMonth ? textColorHighlight : ''}
              `}
              style={{
                backgroundColor: isSelected 
                  ? selectedBgColor 
                  : isInRangeBg 
                    ? rangeBgColor 
                    : 'transparent',
              }}
            >
              <span className={`
                ${day.isToday ? 'font-bold' : ''}
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
              `}>
                {day.day}
              </span>
              
              {day.isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
              
              {day.isHoliday && day.isCurrentMonth && day.holidayName && !isSelected && (
                <motion.div
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setShowHoliday({ 
                      name: day.holidayName, 
                      position: { x: rect.left, y: rect.top } 
                    });
                    setTimeout(() => setShowHoliday(null), 2000);
                  }}
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full cursor-pointer z-10"
                  style={{ backgroundColor: '#f5df90', boxShadow: '0 0 6px rgba(245,223,144,0.6)' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

export default CalendarGrid;