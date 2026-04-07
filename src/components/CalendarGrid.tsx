'use client';

import { useState, useCallback } from 'react';
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
  const [showHoliday, setShowHoliday] = useState<string | null>(null);

  const handleDayClick = useCallback((day: CalendarDay) => {
    if (day.isHoliday && day.isCurrentMonth) {
      setShowHoliday(day.holidayName);
      setTimeout(() => setShowHoliday(null), 2000);
      return;
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
          
          return (
              <motion.button
                key={index}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => handleDayHover(day)}
                onMouseLeave={() => handleDayHover(null)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`
                  relative aspect-square flex items-center justify-center flex-col
                  text-sm font-medium transition-all duration-300 rounded-lg
                  ${!day.isCurrentMonth ? 'text-white/20' : 'text-white/80'}
                  ${isSelected ? 'text-white' : ''}
                  ${isInRangeBg ? 'text-white' : ''}
                  ${day.isHoliday && day.isCurrentMonth ? 'text-red-300' : ''}
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
                {day.isHoliday && day.isCurrentMonth && !isSelected && (
                  <motion.div
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHoliday(day.holidayName);
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
            className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-400/90 backdrop-blur-sm rounded-lg text-xs font-medium text-black shadow-lg z-20"
          >
            {showHoliday}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}