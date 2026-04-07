'use client';

import { useState, useMemo, useEffect, useRef, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Clock as ClockIcon, Type, Eye, Moon, X } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import NotesSection from './NotesSection';
import MiniWhiteboard from './MiniWhiteboard';
import Clock, { ClockStyleSelector } from './Clock';
import { generateCalendarDays, SelectedRange } from '@/lib/calendar-utils';
import { useLocalStorage } from '@/lib/useLocalStorage';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type ToolType = 'whiteboard' | 'clockstyle' | 'font' | 'notes';
type ClockStyle = 'digital' | 'analog' | 'minimal';
type FontStyle = 'serif' | 'sans' | 'mono' | 'display';

// Reducer for calendar navigation to avoid stale state
type CalendarState = {
  month: number;
  year: number;
};

type CalendarAction = 
  | { type: 'PREV_MONTH' }
  | { type: 'NEXT_MONTH' };

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'PREV_MONTH':
      if (state.month === 0) {
        return { month: 11, year: state.year - 1 };
      }
      return { month: state.month - 1, year: state.year };
    case 'NEXT_MONTH':
      if (state.month === 11) {
        return { month: 0, year: state.year + 1 };
      }
      return { month: state.month + 1, year: state.year };
    default:
      return state;
  }
}

export default function WallCalendar() {
  const today = new Date();
  
  // Calendar navigation with useReducer
  const [calendarState, dispatch] = useReducer(calendarReducer, {
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const currentMonth = calendarState.month;
  const currentYear = calendarState.year;

  const [selectedRange, setSelectedRange] = useState<SelectedRange>({
    startDate: null,
    endDate: null,
  });
  const [activeTool, setActiveTool] = useState<ToolType>('notes');
  
  // Persisted settings using useLocalStorage
  const [clockStyle, setClockStyle] = useLocalStorage<ClockStyle>('serene-clock-style', 'digital');
  const [fontStyle, setFontStyle] = useLocalStorage<FontStyle>('serene-font-style', 'sans');
  const [cardOpacity, setCardOpacity] = useLocalStorage<number>('serene-card-opacity', 20);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [monthDirection, setMonthDirection] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const [notesHeight, setNotesHeight] = useState(320);
  const notesSectionRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Resize handler
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !notesSectionRef.current) return;
      const rect = notesSectionRef.current.getBoundingClientRect();
      const newHeight = Math.max(200, Math.min(600, e.clientY - rect.top));
      setNotesHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Throttled parallax using requestAnimationFrame
  useEffect(() => {
    let targetPos = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      targetPos = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 10,
      };
    };

    const updatePosition = () => {
      setMousePos(targetPos);
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const days = useMemo(() => 
    generateCalendarDays(currentYear, currentMonth), 
    [currentYear, currentMonth]
  );

  const handleSelectStart = (date: Date) => {
    setSelectedRange({ startDate: date, endDate: null });
  };

  const handleSelectEnd = (date: Date | null) => {
    setSelectedRange(prev => ({ ...prev, endDate: date }));
  };

  const clearSelection = () => {
    setSelectedRange({ startDate: null, endDate: null });
  };

  // Keyboard shortcuts: j/k for previous/next month, arrow keys also work
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'j':
        case 'ArrowLeft':
          handlePreviousMonth();
          break;
        case 'k':
        case 'ArrowRight':
          handleNextMonth();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePreviousMonth = () => {
    setMonthDirection('right');
    dispatch({ type: 'PREV_MONTH' });
  };

  const handleNextMonth = () => {
    setMonthDirection('left');
    dispatch({ type: 'NEXT_MONTH' });
  };

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'Times New Roman, serif';
      case 'sans': return 'Inter, system-ui, sans-serif';
      case 'mono': return 'Courier New, monospace';
      case 'display': return 'Georgia, serif';
      default: return 'Inter, system-ui, sans-serif';
    }
  };

  const tools = [
    { id: 'whiteboard' as ToolType, icon: Pencil, label: 'Whiteboard' },
    { id: 'clockstyle' as ToolType, icon: ClockIcon, label: 'Clock' },
    { id: 'font' as ToolType, icon: Type, label: 'Font' },
    { id: 'notes' as ToolType, icon: Eye, label: 'Notes' },
  ];

  const fontStyles: { id: FontStyle; label: string; preview: string }[] = [
    { id: 'serif', label: 'Serif', preview: 'Aa Bb Cc' },
    { id: 'sans', label: 'Sans', preview: 'Aa Bb Cc' },
    { id: 'mono', label: 'Mono', preview: 'Aa Bb Cc' },
    { id: 'display', label: 'Display', preview: 'Aa Bb Cc' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900 flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="glass-container">
            <h2 className="text-2xl text-white text-center">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ fontFamily: getFontFamily() }}
      ref={containerRef}
    >
      {/* Background with parallax */}
      <div className="fixed inset-0 bg-black" />
      <motion.div 
        className="fixed inset-0"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: 'tween', duration: 0.1 }}
      >
        <motion.div
          key={currentMonth}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(/img1.jpg)` }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/60" />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
          {/* Header - staggered entrance */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-light text-white tracking-widest drop-shadow-lg">
              {MONTHS[currentMonth]} {currentYear}
            </h1>
          </motion.div>

          {/* Desktop Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Calendar Column with floating animation */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
                className="glass-card glass-card-float"
                style={{ background: `rgba(255, 255, 255, ${cardOpacity / 200})` }}
              >
                <div className="glass-container">
                  {/* Navigation with scale on hover */}
                  <div className="flex items-center justify-between mb-4">
                    <motion.button 
                      onClick={handlePreviousMonth}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-full glass-button"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <h2 className={`text-xl font-medium ${cardOpacity >= 100 ? 'text-black/90' : 'text-white/90'}`}>{MONTHS[currentMonth]} {currentYear}</h2>
                    <motion.button 
                      onClick={handleNextMonth}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-full glass-button"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Calendar Grid with slide animation */}
                  <motion.div
                    key={`${currentMonth}-${currentYear}`}
                    initial={{ opacity: 0, x: monthDirection === 'left' ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: monthDirection === 'left' ? -30 : 30 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <CalendarGrid
                      year={currentYear}
                      month={currentMonth}
                      days={days}
                      selectedStart={selectedRange.startDate}
                      selectedEnd={selectedRange.endDate}
                      onSelectStart={handleSelectStart}
                      onSelectEnd={handleSelectEnd}
                      containerOpacity={cardOpacity}
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Tool Buttons with hover animations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="mt-4"
              >
                {/* Tool Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {tools.map((tool, index) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    
                    return (
                      <motion.button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200
                          ${isActive 
                            ? 'bg-white/25 text-white shadow-lg toolbar-icon-active' 
                            : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white toolbar-icon'
                          }
                        `}
                      >
                        <Icon size={18} />
                        <span className="text-[10px] font-medium">{tool.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center gap-2 px-2">
                  <span className={`text-xs whitespace-nowrap ${cardOpacity >= 100 ? 'text-black/50' : 'text-white/50'}`}>Opacity:</span>
                  <motion.input
                    type="range"
                    min="5"
                    max="100"
                    value={cardOpacity}
                    onChange={(e) => setCardOpacity(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    whileTap={{ scale: 0.95 }}
                  />
                  <span className={`text-xs w-8 ${cardOpacity >= 100 ? 'text-black/70' : 'text-white/70'}`}>{cardOpacity}%</span>
                </div>
              </motion.div>
            </div>

            {/* Right Side: Clock + Notes */}
            <div className="lg:col-span-2 space-y-4">
              {/* Clock - isolated component with its own timer */}
              <Clock style={clockStyle} containerOpacity={cardOpacity} />

              {/* Notes / Whiteboard Section */}
              <motion.div
                ref={notesSectionRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="glass-card"
                style={{ background: `rgba(255, 255, 255, ${cardOpacity / 200})`, height: notesHeight }}
              >
                {/* Resize handle */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/20 transition-colors"
                  onMouseDown={startResize}
                />
                <div className="glass-container py-4 h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeTool === 'notes' && (
                      <motion.div
                        key="notes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <NotesSection
                          selectedStart={selectedRange.startDate}
                          selectedEnd={selectedRange.endDate}
                        />
                      </motion.div>
                    )}
                    
                    {activeTool === 'whiteboard' && (
                      <motion.div
                        key="whiteboard"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MiniWhiteboard />
                      </motion.div>
                    )}
                    
                    {activeTool === 'clockstyle' && (
                      <ClockStyleSelector 
                        currentStyle={clockStyle} 
                        onStyleChange={setClockStyle}
                        containerOpacity={cardOpacity}
                      />
                    )}
                    
                    {activeTool === 'font' && (
                      <motion.div
                        key="font"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="py-4"
                      >
                        <div className="space-y-2">
                          {fontStyles.map((font) => (
                            <motion.button
                              key={font.id}
                              onClick={() => setFontStyle(font.id)}
                              whileHover={{ scale: 1.01, x: 4 }}
                              whileTap={{ scale: 0.99 }}
                              className={`
                                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                                ${fontStyle === font.id 
                                  ? 'bg-white/25 text-white' 
                                  : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                                }
                              `}
                              style={{ fontFamily: font.id === 'serif' ? 'Times New Roman, serif' : font.id === 'mono' ? 'Courier New, monospace' : font.id === 'display' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif' }}
                            >
                              <span className="text-lg">{font.preview}</span>
                              <span className="text-sm opacity-70">{font.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Selection badge with pop animation */}
          <AnimatePresence>
            {selectedRange.startDate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center mt-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="glass-badge cursor-pointer"
                >
                  <span className="text-white">
                    {selectedRange.startDate.getDate()}{selectedRange.endDate ? ` - ${selectedRange.endDate.getDate()}` : ''} {MONTHS[currentMonth]}
                  </span>
                  <button 
                    onClick={clearSelection}
                    className="ml-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
