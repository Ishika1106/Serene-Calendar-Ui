'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Clock, Type, Eye, Moon } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import NotesSection from './NotesSection';
import MiniWhiteboard from './MiniWhiteboard';
import { generateCalendarDays, SelectedRange } from '@/lib/calendar-utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type ToolType = 'whiteboard' | 'clockstyle' | 'font' | 'view';
type ClockStyle = 'digital' | 'analog' | 'minimal';
type FontStyle = 'serif' | 'sans' | 'mono' | 'display';

export default function WallCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedRange, setSelectedRange] = useState<SelectedRange>({
    startDate: null,
    endDate: null,
  });
  const [activeTool, setActiveTool] = useState<ToolType>('view');
  const [clockStyle, setClockStyle] = useState<ClockStyle>('digital');
  const [fontStyle, setFontStyle] = useState<FontStyle>('sans');
  const [cardOpacity, setCardOpacity] = useState(20);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [monthDirection, setMonthDirection] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [notesHeight, setNotesHeight] = useState(320);
  const notesSectionRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Background parallax on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

  const handlePreviousMonth = () => {
    setMonthDirection('right');
    setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
    if (currentMonth === 0) setCurrentYear(prev => prev - 1);
  };

  const handleNextMonth = () => {
    setMonthDirection('left');
    setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);
    if (currentMonth === 11) setCurrentYear(prev => prev + 1);
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
    { id: 'clockstyle' as ToolType, icon: Clock, label: 'Clock' },
    { id: 'font' as ToolType, icon: Type, label: 'Font' },
    { id: 'view' as ToolType, icon: Eye, label: 'View' },
  ];

  const clockStyles: { id: ClockStyle; icon: any; label: string }[] = [
    { id: 'digital', icon: Clock, label: 'Digital' },
    { id: 'analog', icon: Clock, label: 'Analog' },
    { id: 'minimal', icon: Moon, label: 'Minimal' },
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
                    <h2 className="text-xl font-medium text-white/90">{MONTHS[currentMonth]}</h2>
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
                  <span className="text-white/50 text-xs whitespace-nowrap">Opacity:</span>
                  <motion.input
                    type="range"
                    min="5"
                    max="100"
                    value={cardOpacity}
                    onChange={(e) => setCardOpacity(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    whileTap={{ scale: 0.95 }}
                  />
                  <span className="text-white/70 text-xs w-8">{cardOpacity}%</span>
                </div>
              </motion.div>
            </div>

            {/* Right Side: Clock + Notes */}
            <div className="lg:col-span-2 space-y-4">
              {/* Clock with floating animation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
                className="glass-card glass-card-float-delayed"
                style={{ background: `rgba(255, 255, 255, ${cardOpacity / 200})` }}
              >
                <div className="glass-container py-6">
                  <AnimatePresence mode="wait">
                    {clockStyle === 'digital' && (
                      <motion.div
                        key="digital"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <div className="text-6xl md:text-7xl font-light text-white/90 tracking-wider">
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <motion.div 
                          key={currentTime.toLocaleDateString()}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-white/50 mt-2 text-lg"
                        >
                          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </motion.div>
                      </motion.div>
                    )}
                    
                    {clockStyle === 'analog' && (
                      <motion.div
                        key="analog"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <div className="relative w-40 h-40 rounded-full border-4 border-white/20">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-3 bg-white/40"
                              style={{
                                top: '8px',
                                left: '50%',
                                transform: `translateX(-50%) rotate(${i * 30}deg)`,
                                transformOrigin: '50% 60px',
                              }}
                            />
                          ))}
                          <motion.div
                            className="absolute w-1 h-10 bg-white rounded-full"
                            style={{
                              bottom: '50%',
                              left: '50%',
                              transformOrigin: 'bottom center',
                              transform: `translateX(-50%) rotate(${(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5}deg)`,
                            }}
                            animate={{ rotate: [(currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5] }}
                            transition={{ duration: 0.5 }}
                          />
                          <motion.div
                            className="absolute w-0.5 h-14 bg-white/80 rounded-full"
                            style={{
                              bottom: '50%',
                              left: '50%',
                              transformOrigin: 'bottom center',
                              transform: `translateX(-50%) rotate(${currentTime.getMinutes() * 6}deg)`,
                            }}
                            animate={{ rotate: [currentTime.getMinutes() * 6] }}
                            transition={{ duration: 0.5 }}
                          />
                          <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      </motion.div>
                    )}
                    
                    {clockStyle === 'minimal' && (
                      <motion.div
                        key="minimal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                      >
                        <div className="text-8xl font-thin text-white/90">
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <motion.div 
                          key={`minimal-${currentTime.getDate()}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-white/40 text-xl mt-2 uppercase tracking-widest"
                        >
                          {currentTime.toLocaleDateString([], { weekday: 'long' })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Notes / Whiteboard Section with slide-up animation */}
              <motion.div
                ref={notesSectionRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
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
                    {activeTool === 'view' && (
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
                        className="animate-slide-up"
                      >
                        <MiniWhiteboard />
                      </motion.div>
                    )}
                    
                    {activeTool === 'clockstyle' && (
                      <motion.div
                        key="clockstyle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="py-4"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {clockStyles.map((style) => {
                            const Icon = style.icon;
                            const isActive = clockStyle === style.id;
                            
                            return (
                              <motion.button
                                key={style.id}
                                onClick={() => setClockStyle(style.id)}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className={`
                                  flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                  ${isActive 
                                    ? 'bg-white/25 text-white shadow-lg' 
                                    : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                                  }
                                `}
                              >
                                <Icon size={24} />
                                <span className="text-sm">{style.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
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
                    ×
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