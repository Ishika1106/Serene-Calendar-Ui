'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock as ClockIcon, Moon } from 'lucide-react';

type ClockStyle = 'digital' | 'analog' | 'minimal';

interface ClockProps {
  style: ClockStyle;
  containerOpacity: number;
}

export default function Clock({ style, containerOpacity }: ClockProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Isolated timer - only updates this component
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hourRotation = (currentTime.getHours() % 12) * 30 + currentTime.getMinutes() * 0.5;
  const minuteRotation = currentTime.getMinutes() * 6;

  return (
    <div 
      className="glass-card glass-card-float-delayed"
      style={{ background: `rgba(255, 255, 255, ${containerOpacity / 200})` }}
    >
      <div className="glass-container py-6">
        <AnimatePresence mode="wait">
          {style === 'digital' && (
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
          
          {style === 'analog' && (
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
                <div
                  className="absolute w-1 h-10 bg-white rounded-full"
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transformOrigin: 'bottom center',
                    transform: `translateX(-50%) rotate(${hourRotation}deg)`,
                    transition: 'transform 0.5s ease-out',
                  }}
                />
                <div
                  className="absolute w-0.5 h-14 bg-white/80 rounded-full"
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transformOrigin: 'bottom center',
                    transform: `translateX(-50%) rotate(${minuteRotation}deg)`,
                    transition: 'transform 0.5s ease-out',
                  }}
                />
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
            </motion.div>
          )}
          
          {style === 'minimal' && (
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
    </div>
  );
}

// Clock style selector component - also isolated
interface ClockStyleSelectorProps {
  currentStyle: ClockStyle;
  onStyleChange: (style: ClockStyle) => void;
  containerOpacity: number;
}

export function ClockStyleSelector({ currentStyle, onStyleChange, containerOpacity }: ClockStyleSelectorProps) {
  const styles: { id: ClockStyle; icon: typeof ClockIcon; label: string }[] = [
    { id: 'digital', icon: ClockIcon, label: 'Digital' },
    { id: 'analog', icon: ClockIcon, label: 'Analog' },
    { id: 'minimal', icon: Moon, label: 'Minimal' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="py-4"
    >
      <div className="grid grid-cols-3 gap-3">
        {styles.map((styleItem) => {
          const Icon = styleItem.icon;
          const isActive = currentStyle === styleItem.id;
          
          return (
            <motion.button
              key={styleItem.id}
              onClick={() => onStyleChange(styleItem.id)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                ${isActive 
                  ? 'bg-white/25 text-white shadow-lg' 
                  : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                }
              `}
              style={{ background: isActive ? undefined : `rgba(255,255,255, ${containerOpacity / 400})` }}
            >
              <Icon size={24} />
              <span className="text-sm">{styleItem.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}