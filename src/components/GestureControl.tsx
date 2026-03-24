import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Camera,
  Zap,
  MessageSquare,
  Phone,
  Cpu,
  Globe,
  Monitor,
  AlertCircle
} from 'lucide-react';
import { GeminiLiveService, GestureAction } from '../services/geminiLiveService';

interface GestureControlProps {
  isAuraMode: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const APP_TABS = [
  { id: 'chat', title: 'Neural Chat', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'phone', title: 'Voice Link', icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'memory', title: 'Core Memory', icon: Cpu, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'gestures', title: 'Gesture Control', icon: Hand, color: 'text-[#ff4e00]', bg: 'bg-[#ff4e00]/10' },
  { id: 'tools', title: 'Global Tools', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'vision', title: 'Visual Analysis', icon: Camera, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];

export default function GestureControl({ isAuraMode, activeTab, onTabChange }: GestureControlProps) {
  const [lastGesture, setLastGesture] = useState<GestureAction | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isGlobalNav, setIsGlobalNav] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCardIndex = APP_TABS.findIndex(t => t.id === activeTab);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const handleGesture = (gesture: GestureAction) => {
    setLastGesture(gesture);
    
    if (gesture.type === 'swipe_left') {
      const nextIndex = activeCardIndex > 0 ? activeCardIndex - 1 : APP_TABS.length - 1;
      onTabChange(APP_TABS[nextIndex].id);
    } else if (gesture.type === 'swipe_right') {
      const nextIndex = activeCardIndex < APP_TABS.length - 1 ? activeCardIndex + 1 : 0;
      onTabChange(APP_TABS[nextIndex].id);
    } else if (gesture.type === 'confirm') {
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } else if (gesture.type === 'cancel') {
      setShowConfirmation(false);
    }

    // Clear gesture indicator after a delay
    setTimeout(() => setLastGesture(null), 1500);
  };

  const startGestureControl = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const apiKey = process.env.GEMINI_API_KEY || '';
      serviceRef.current = new GeminiLiveService(apiKey, handleGesture);
      await serviceRef.current.connect();

      setIsLive(true);
      
      // Start sending frames
      frameIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current && serviceRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 320; // Lower resolution for faster processing
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            serviceRef.current.sendFrame(base64Data);
          }
        }
      }, 500); // Send frame every 500ms

    } catch (err: any) {
      console.error('Failed to start gesture control:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission dismissed')) {
        setError('Camera permission was denied or dismissed. Please allow camera access to use gesture control.');
      } else {
        setError(err.message || 'Failed to start gesture control.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const stopGestureControl = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  };

  useEffect(() => {
    return () => stopGestureControl();
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12 space-y-8 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Module</span>
          <h2 className="text-3xl font-light serif italic">Aura Vision: Gestures</h2>
        </div>
        
        <button
          onClick={isLive ? stopGestureControl : startGestureControl}
          disabled={isConnecting}
          className={`px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-500 ${
            isLive 
              ? 'bg-red-500/20 border border-red-500 text-red-500' 
              : 'bg-[#ff4e00] text-white shadow-[0_0_20px_rgba(255,78,0,0.3)]'
          }`}
        >
          {isConnecting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : isLive ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">
            {isConnecting ? 'Initializing...' : isLive ? 'Stop Vision' : 'Start Vision'}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Gesture Interface */}
        <div className="flex flex-col space-y-6 relative">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -50 }}
                className={`w-64 h-80 rounded-[40px] ${APP_TABS[activeCardIndex].bg} border border-white/10 flex flex-col items-center justify-center p-8 text-center shadow-2xl`}
              >
                <div className={`p-6 rounded-full bg-black/40 mb-6 ${APP_TABS[activeCardIndex].color}`}>
                  {React.createElement(APP_TABS[activeCardIndex].icon, { size: 48 })}
                </div>
                <h3 className="text-2xl font-light mb-2">{APP_TABS[activeCardIndex].title}</h3>
                <p className="text-white/40 text-xs">Swipe to navigate between modules.</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Indicators */}
            <div className="absolute bottom-8 flex gap-2">
              {APP_TABS.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeCardIndex ? 'bg-[#ff4e00] w-4' : 'bg-white/20'}`} 
                />
              ))}
            </div>

            {/* Gesture Feedback Overlay */}
            <AnimatePresence>
              {lastGesture && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-8 px-6 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-3"
                >
                  {lastGesture.type === 'swipe_left' && <ArrowLeft className="w-4 h-4 text-orange-500" />}
                  {lastGesture.type === 'swipe_right' && <ArrowRight className="w-4 h-4 text-orange-500" />}
                  {lastGesture.type === 'confirm' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {lastGesture.type === 'cancel' && <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-[10px] uppercase tracking-widest font-bold">{lastGesture.description}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation Overlay */}
            <AnimatePresence>
              {showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 bg-[#ff4e00]/20 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-[32px]"
                >
                  <div className="w-24 h-24 bg-white text-[#ff4e00] rounded-full flex items-center justify-center shadow-2xl mb-4">
                    <CheckCircle2 size={48} />
                  </div>
                  <h4 className="text-2xl font-bold uppercase tracking-tighter">Activated</h4>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <GestureHint icon={ArrowLeft} label="Swipe Left" />
            <GestureHint icon={ArrowRight} label="Swipe Right" />
            <GestureHint icon={CheckCircle2} label="Thumbs Up" />
            <GestureHint icon={XCircle} label="Open Palm" />
          </div>
        </div>

        {/* Camera & Tech Info */}
        <div className="flex flex-col space-y-6">
          <div className="aspect-video bg-black rounded-[32px] border border-white/10 overflow-hidden relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover grayscale contrast-125 brightness-75 transition-opacity duration-1000 ${isLive ? 'opacity-100' : 'opacity-20'}`} 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                <span className="text-[10px] font-mono uppercase text-white/60 tracking-widest">
                  {isLive ? 'Aura Vision Active' : 'Vision Standby'}
                </span>
              </div>
              
              {/* Scanning Lines */}
              {isLive && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff4e00]/5 to-transparent h-20 w-full animate-scan" />
              )}
            </div>

            {!isLive && !isConnecting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 space-y-4">
                <Hand size={48} className="opacity-10" />
                <p className="text-[10px] uppercase tracking-[0.3em]">Initialize Neural Link</p>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#ff4e00]" />
              <span className="text-xs font-bold uppercase tracking-widest">Neural Processing</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Gesture Confidence</span>
                <span className="text-xs font-mono text-[#ff4e00]">94.2%</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: isLive ? '94.2%' : '0%' }}
                  className="h-full bg-[#ff4e00]"
                />
              </div>

              <div className="flex justify-between items-end">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Latency</span>
                <span className="text-xs font-mono text-emerald-400">120ms</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: isLive ? '12%' : '0%' }}
                  className="h-full bg-emerald-400"
                />
              </div>
            </div>

            <p className="text-[10px] text-white/30 leading-relaxed font-mono">
              [SYSTEM]: Aura is interpreting your visual intent. 
              The multimodal engine is processing spatial coordinates 
              and temporal vectors to map physical movement to 
              interface commands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GestureHint({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
      <Icon size={16} className="text-white/40" />
      <span className="text-[8px] uppercase tracking-widest text-white/40 text-center">{label}</span>
    </div>
  );
}
