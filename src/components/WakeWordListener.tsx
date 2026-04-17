import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WakeWordListenerProps {
  onWake: () => void;
  onCommand: (command: string) => void;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function WakeWordListener({ onWake, onCommand, isActive, isMuted, onToggleMute }: WakeWordListenerProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || isMuted) return;

    let isMounted = true;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.trim().toLowerCase();
      
      console.log('Voice input:', text);

      if (text.includes('hey aura') || text.includes('aura')) {
        onWake();
        // If there's more text after the wake word, treat it as a command
        const command = text.split(/hey aura|aura/i).pop()?.trim();
        if (command) {
          onCommand(command);
        }
      }
    };

    recognition.onstart = () => {
      if (isMounted) setIsListening(true);
    };

    recognition.onend = () => {
      if (isMounted) {
        setIsListening(false);
        // Restart if still active and not muted
        if (isActive && !isMuted) {
          // Add a small delay to prevent rapid restarting loop
          setTimeout(() => {
            if (isMounted) {
              try {
                recognition.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 1000);
        }
      }
    };

    recognitionRef.current = recognition;

    if (isActive && !isMuted) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }

    return () => {
      isMounted = false;
      try {
        recognition.stop();
      } catch (e) {
        // Ignore stop errors
      }
    };
  }, [isActive, isMuted, onWake, onCommand]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full cursor-pointer hover:bg-white/5 transition-colors"
          onClick={onToggleMute}
        >
          <div className="relative">
            {isMuted ? (
              <MicOff className="w-4 h-4 text-white/20" />
            ) : (
              <>
                <Mic className={`w-4 h-4 ${isListening ? 'text-[#ff4e00]' : 'text-white/40'}`} />
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-[#ff4e00]/20 rounded-full -z-10"
                  />
                )}
              </>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-white/60">
            {isMuted ? 'Voice Activation Muted' : isListening ? 'Listening for "Hey Aura"' : 'Voice Offline'}
          </span>
          {!isMuted && <Sparkles className="w-3 h-3 text-[#ff4e00] animate-pulse" />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
