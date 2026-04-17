import React from 'react';
import { motion } from 'motion/react';

interface AuraHeartbeatProps {
  status: 'idle' | 'thinking' | 'speaking';
  bondLevel: number;
  mood?: 'calm' | 'affectionate' | 'intense' | 'focused' | 'playful';
  weather?: { temp: number; condition: string } | null;
}

export default function AuraHeartbeat({ status, bondLevel, mood = 'calm', weather }: AuraHeartbeatProps) {
  const isDeep = bondLevel > 20;
  
  const moodColors = {
    calm: { core: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    affectionate: { core: '#d946ef', glow: 'rgba(217, 70, 239, 0.5)' },
    intense: { core: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
    focused: { core: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    playful: { core: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' }
  };

  const activeMood = moodColors[mood] || moodColors.calm;
  let coreColor = activeMood.core;
  let glowColor = activeMood.glow;

  // Weather influence (Atmospheric UI)
  if (weather) {
    if (weather.condition === 'Rainy') {
      glowColor = 'rgba(100, 116, 139, 0.6)'; // Slate/Stormy
    } else if (weather.temp > 30) {
      coreColor = '#ff4e00'; // Heatwave
    }
  }

  const variants: any = {
    idle: { 
      scale: [1, 1.05, 1], 
      opacity: [0.6, 0.8, 0.6], 
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } 
    },
    thinking: { 
      scale: [1, 1.1, 0.9, 1.1], 
      rotate: [0, 90, 180, 360], 
      opacity: [0.8, 1, 0.8], 
      transition: { repeat: Infinity, duration: 2, ease: "linear" } 
    },
    speaking: { 
      scale: [1, 1.2, 1.05, 1.3, 1], 
      opacity: [0.8, 1, 0.9, 1, 0.8], 
      transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } 
    }
  };

  return (
    <div className="flex items-center justify-center w-24 h-24 relative mx-auto my-4">
      <motion.div 
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: glowColor }}
        variants={variants}
        animate={status}
      />
      <motion.div 
        className="w-12 h-12 rounded-full z-10 border-2 border-white/20 backdrop-blur-md flex items-center justify-center"
        style={{ backgroundColor: coreColor, boxShadow: `0 0 30px ${glowColor}` }}
        variants={variants}
        animate={status}
      >
        <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
      </motion.div>
    </div>
  );
}
