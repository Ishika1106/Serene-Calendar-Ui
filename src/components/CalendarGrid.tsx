'use client';

import { useState, useCallback, useEffect } from 'react';
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
}

export default function CalendarGrid({
  year,
  month,
  days,
  selectedStart,
  selectedEnd,
  onSelectStart,
  onSelectEnd,
}: CalendarGridProps) {
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [showHoliday, setShowHoliday] = useState<{ name: string | null; position: { x: number; y: number } } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

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

  return (
    <div className="glass-calendar">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-white/60 py-2"
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
          
          // Format date for accessibility
          const dateLabel = new Date(year, month, day.day).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          return (
            <motion.button
              key={index}
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
                ${!day.isCurrentMonth ? 'text-white/20' : 'text-white/80'}
                ${isSelected ? 'text-white calendar-date-selected' : ''}
                ${isInRangeBg ? 'text-white' : ''}
                ${isFocused ? 'ring-2 ring-white/50' : ''}
                ${day.isHoliday && day.isCurrentMonth ? 'text-yellow-200' : ''}
              `}
              style={{
                backgroundColor: isSelected 
                  ? 'rgba(255,255,255,0.35)' 
                  : isInRangeBg 
                    ? 'rgba(255,255,255,0.15)' 
                    : 'transparent',
              }}
            >
              <span className={`
                ${day.isToday ? 'font-bold' : ''}
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
              `}>
                {day.day}
              </span>
              
              {/* Today indicator */}
              {day.isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
              
              {/* Holiday marker */}
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
      
      {/* Holiday popup */}
      <AnimatePresence>
        {showHoliday && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed px-3 py-1.5 bg-yellow-400/90 backdrop-blur-sm rounded-lg text-xs font-medium text-black shadow-lg z-50"
            style={{
              left: showHoliday.position.x,
              top: showHoliday.position.y - 40,
              transform: 'translateX(-50%)',
            }}
          >
            {showHoliday.name}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}