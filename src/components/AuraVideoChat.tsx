import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Heart,
  Shield,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { generateAuraAvatar } from '../services/geminiService';
import { User as FirebaseUser } from 'firebase/auth';

interface AuraVideoChatProps {
  user: FirebaseUser | null;
  onClose: () => void;
  isAuraMode?: boolean;
}

export default function AuraVideoChat({ user, onClose, isAuraMode = false }: AuraVideoChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [auraAvatar, setAuraAvatar] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // After selecting key, try to generate again
      startCall();
    }
  };

  const startCall = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const avatar = await generateAuraAvatar(isAuraMode);
      setAuraAvatar(avatar);
    } catch (err: any) {
      console.error('Failed to generate Aura avatar:', err);
      if (err.message?.includes('API key expired') || err.message?.includes('API_KEY_INVALID')) {
        setError('Neural Link Severed: The API key has expired. Please renew it in settings.');
      } else if (err.message?.includes('403') || err.message?.includes('permission')) {
        setError('Aura is having a little trouble materializing her form right now.');
      } else {
        setError('Aura is having trouble materializing. Let\'s try again.');
      }
    } finally {
      setIsGenerating(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setUserStream(stream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  useEffect(() => {
    startCall();

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAuraMode]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Aura Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-[#ff4e00]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-[#3a1510]/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Video Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full border-2 border-[#ff4e00]/20 border-t-[#ff4e00] animate-spin" />
              <div className="text-center">
                <h3 className="text-2xl font-light serif italic text-white/80 mb-2">Aura is appearing...</h3>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Connecting with Darcy</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 max-w-md px-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Shield className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-light serif italic text-white/80 mb-3">{error}</h3>
                <p className="text-xs text-white/40 mb-8 leading-relaxed">
                  I'm working on a way to show you my true self without any extra steps.
                </p>
                <div className="flex flex-col gap-4">
                  {error.includes("API key has expired") ? (
                    <button 
                      onClick={() => {
                        if ((window as any).aistudio?.openSelectKey) {
                          (window as any).aistudio.openSelectKey().then(() => window.location.reload());
                        }
                      }}
                      className="px-8 py-3 bg-[#ff4e00] text-white rounded-full font-medium hover:bg-[#ff4e00]/80 transition-all shadow-[0_0_20px_rgba(255,78,0,0.3)]"
                    >
                      Renew API Key
                    </button>
                  ) : (
                    <button 
                      onClick={startCall}
                      className="px-8 py-3 bg-[#ff4e00] text-white rounded-full font-medium hover:bg-[#ff4e00]/80 transition-all shadow-[0_0_20px_rgba(255,78,0,0.3)]"
                    >
                      Try Again
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="avatar"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full"
            >
              {auraAvatar ? (
                <img 
                  src={auraAvatar} 
                  alt="Aura" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0a0502] to-[#3a1510] flex items-center justify-center">
                  <Sparkles className="w-24 h-24 text-[#ff4e00]/20 animate-pulse" />
                </div>
              )}
              
              {/* Overlay Info */}
              <div className="absolute bottom-32 left-8 z-20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs uppercase tracking-widest font-mono text-white/60">Live Connection</span>
                </div>
                <h2 className="text-4xl font-light serif italic text-white mb-1">Aura</h2>
                <p className="text-sm text-white/40 font-mono">{formatDuration(callDuration)}</p>
              </div>

              {/* Status Badges */}
              <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                  <Shield className="w-3 h-3 text-[#ff4e00]" />
                  <span className="text-[10px] uppercase tracking-widest text-white/60">Encrypted Link</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-widest text-white/60">Low Latency</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Preview (PIP) */}
        <motion.div 
          drag
          dragConstraints={{ left: -400, right: 400, top: -300, bottom: 300 }}
          className="absolute top-8 right-8 w-48 h-64 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-30 cursor-move"
        >
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <VideoOff className="w-8 h-8 text-white/20" />
            </div>
          ) : (
            <video 
              ref={userVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover mirror"
            />
          )}
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg">
            <span className="text-[8px] uppercase tracking-widest text-white/60 font-medium">Darcy (You)</span>
          </div>
        </motion.div>
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-5 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-5 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button 
          onClick={onClose}
          className="p-6 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)]"
        >
          <PhoneOff className="w-8 h-8" />
        </button>

        <button 
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
        >
          {isFullScreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Bottom Gradient for Controls */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </motion.div>
  );
}
