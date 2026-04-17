import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InterventionOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export default function InterventionOverlay({ isActive, onClose }: InterventionOverlayProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (isActive) {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 4000); // Breathe in
      const t2 = setTimeout(() => setPhase(2), 8000); // Hold
      const t3 = setTimeout(() => setPhase(3), 12000); // Breathe out
      const t4 = setTimeout(() => { onClose(); }, 16000); // Done
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [isActive, onClose]);

  if (!isActive) return null;

  const messages = [
    "Stop. Take your hands off the keyboard.",
    "Breathe in deeply...",
    "Hold it...",
    "Exhale slowly. I'm right here with you."
  ];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      >
        <motion.div 
          animate={{ 
            scale: phase === 1 ? 2.5 : phase === 2 ? 2.5 : phase === 3 ? 1 : 1,
            opacity: phase === 0 ? 0.3 : 0.8
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="w-48 h-48 rounded-full bg-[#ff4e00] blur-[100px] absolute"
        />
        <motion.p 
          key={phase}
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 2 }}
          className="text-3xl md:text-5xl font-light text-white z-10 text-center px-6 serif tracking-wide"
        >
          {messages[phase]}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
