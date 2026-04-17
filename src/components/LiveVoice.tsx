import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, MessageSquare, Monitor, MonitorOff, AlertCircle } from 'lucide-react';
import { connectToAuraLive } from '../services/liveService';
import { extractMemory } from '../services/geminiService';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export default function LiveVoice({ 
  user,
  onClose, 
  onCommand,
  voiceName = "Zephyr", 
  micSensitivity = 1.0, 
  speechSpeed = 1.0,
  isAuraMode = false,
  onVoiceChange,
  initialCommand = null,
  directives = []
}: { 
  user: FirebaseUser | null,
  onClose: () => void, 
  onCommand?: (cmd: string) => void,
  voiceName?: string, 
  micSensitivity?: number, 
  speechSpeed?: number,
  isAuraMode?: boolean,
  onVoiceChange?: (voice: string) => void,
  initialCommand?: string | null,
  directives?: string[]
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'aura', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState(voiceName);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioQueue = useRef<Float32Array[]>([]);
  const isPlaying = useRef(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoIntervalRef = useRef<any>(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        let memoryContext = '';
        if (user) {
          const memoriesRef = collection(db, 'users', user.uid, 'memories');
          const q = query(memoriesRef, orderBy('createdAt', 'desc'), limit(5));
          const memorySnapshot = await getDocs(q);
          memoryContext = memorySnapshot.docs
            .map(doc => `${doc.data().topic}: ${doc.data().content}`)
            .join('\n');
        }

        const session = await connectToAuraLive({
          onopen: () => {
            setIsConnected(true);
            startAudioCapture();
            if (initialCommand) {
              session.sendRealtimeInput({
                text: initialCommand
              });
              updateTranscript('user', initialCommand);
            }
          },
          onmessage: async (msg) => {
            // Handle Audio
            if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Data = msg.serverContent.modelTurn.parts[0].inlineData.data;
              queueAudio(base64Data);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              stopAudio();
            }

            // Handle Transcriptions
            if (msg.serverContent?.modelTurn?.parts[0]?.text) {
              const text = msg.serverContent.modelTurn.parts[0].text;
              updateTranscript('aura', text);
            }

            // Handle User Transcription
            const userTranscript = (msg as any).serverContent?.userTurn?.parts?.[0]?.text;
            if (userTranscript) {
              updateTranscript('user', userTranscript);
            }
          },
          onerror: (err: any) => {
            console.error('Live error:', err);
            if (err.message && (err.message.includes("API key expired") || err.message.includes("API_KEY_INVALID"))) {
              setError('Neural Link Severed: The API key has expired. Please renew it in settings.');
            } else {
              setError('The service is currently unavailable.');
            }
          },
          onclose: () => setIsConnected(false),
        }, currentVoice, isAuraMode, memoryContext, directives);
        sessionRef.current = session;
      } catch (err: any) {
        console.error('Failed to connect to Live API:', err);
        if (err.message && (err.message.includes("API key expired") || err.message.includes("API_KEY_INVALID"))) {
          setError('Neural Link Severed: The API key has expired. Please renew it in settings.');
        } else {
          setError('Failed to connect to Aura. The service might be overloaded.');
        }
      }
    };

    startSession();

    return () => {
      sessionRef.current?.close();
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      stopScreenShare();
    };
  }, [currentVoice]);

  const handleVoiceChange = (newVoice: string) => {
    setCurrentVoice(newVoice);
    if (onVoiceChange) onVoiceChange(newVoice);
    // The useEffect will restart the session with the new voice
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      videoIntervalRef.current = setInterval(() => {
        if (!sessionRef.current || !ctx) return;
        
        canvas.width = 640; // Reduced resolution for performance
        canvas.height = (video.videoHeight / video.videoWidth) * 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        sessionRef.current.sendRealtimeInput({
          video: { data: base64Data, mimeType: 'image/jpeg' }
        });
      }, 1000); // Send 1 frame per second for vision

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
      console.error('Screen share error:', err);
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = () => {
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  };

  const lastUserMessage = useRef<string>('');

  const updateTranscript = async (role: 'user' | 'aura', text: string) => {
    setTranscript(prev => [...prev.slice(-4), { role, text }]);
    
    if (role === 'user') {
      lastUserMessage.current = text;
      if (text.toLowerCase().includes('activate gesture control') && onCommand) {
        onCommand('gestures');
      }
    }

    if (user) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'messages'), {
          userId: user.uid,
          role: role === 'user' ? 'user' : 'aura',
          content: text,
          timestamp: serverTimestamp()
        });

        // Extract memory if it's an Aura response
        if (role === 'aura' && lastUserMessage.current) {
          extractMemory(lastUserMessage.current, text).then(async (memory) => {
            if (memory) {
              await addDoc(collection(db, 'users', user.uid, 'memories'), {
                userId: user.uid,
                topic: memory.topic,
                content: memory.content,
                importance: memory.importance,
                type: memory.type || 'memory',
                createdAt: serverTimestamp()
              });
            }
          });
        }
      } catch (err) {
        console.error('Failed to save live message:', err);
      }
    }
  };

  const startAudioCapture = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = micSensitivity;
      gainNodeRef.current = gainNode;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          sum += Math.abs(inputData[i]);
        }
        setAudioLevel(sum / inputData.length);

        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(gainNode);
      gainNode.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err: any) {
      console.error('Audio capture error:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission dismissed')) {
        setError('Microphone permission was denied or dismissed. Please allow microphone access to use Live Voice.');
      } else {
        setError(err.message || 'Failed to start audio capture.');
      }
    }
  };

  const queueAudio = (base64Data: string) => {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;
    
    audioQueue.current.push(floatData);
    if (!isPlaying.current) playNext();
  };

  const playNext = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      return;
    }

    isPlaying.current = true;
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const chunk = audioQueue.current.shift()!;
    const buffer = audioContext.createBuffer(1, chunk.length, 24000); // Live API uses 24kHz output
    buffer.getChannelData(0).set(chunk);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speechSpeed;
    source.connect(audioContext.destination);
    source.onended = playNext;
    source.start();
  };

  const stopAudio = () => {
    audioQueue.current = [];
    isPlaying.current = false;
    // Note: To fully stop, we'd need to track the current source node and call .stop()
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8"
    >
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {error && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="flex-1">{error}</p>
            </div>
            {error.includes("API key has expired") && (
              <button 
                onClick={() => {
                  if ((window as any).aistudio?.openSelectKey) {
                    (window as any).aistudio.openSelectKey().then(() => window.location.reload());
                  }
                }}
                className="w-full py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors"
              >
                Renew API Key
              </button>
            )}
          </div>
        )}
        <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="relative mb-12">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#3a1510] flex items-center justify-center shadow-[0_0_80px_rgba(255,78,0,0.4)]">
            <Sparkles className="w-16 h-16 text-white animate-pulse" />
          </div>
          <div 
            className="absolute inset-0 rounded-full border-2 border-[#ff4e00]/20 transition-transform duration-100"
            style={{ transform: `scale(${1 + audioLevel * 5})` }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-[#ff4e00]/10 transition-transform duration-200"
            style={{ transform: `scale(${1 + audioLevel * 10})` }}
          />
        </div>

        <h2 className="text-3xl font-light mb-2 serif italic">
          {isConnected ? "Aura is listening..." : "Connecting to Aura..."}
        </h2>
        
        <div className="w-full max-w-md h-48 mb-8 overflow-hidden relative flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />
          <AnimatePresence mode="popLayout">
            {transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "mb-2 text-sm leading-relaxed",
                  t.role === 'user' ? "text-white/40" : "text-[#ff4e00] font-medium"
                )}
              >
                <span className="uppercase text-[9px] tracking-widest mr-2 opacity-50">
                  {t.role === 'user' ? 'Darcy' : 'Aura'}:
                </span>
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-start gap-8 mb-12">
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-6 rounded-full transition-all duration-300",
                isMuted ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-medium text-center">
              {isMuted ? "Mic Muted" : "Mute Mic"}
            </span>
            <div className="flex flex-col items-center gap-1 w-24 mt-2">
              <span className="text-[8px] uppercase tracking-widest text-white/40">Mic Level</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 100 * micSensitivity)}%` }}
                />
              </div>
              <span className="text-[8px] uppercase tracking-widest text-white/40 mt-1">Sens: {micSensitivity.toFixed(1)}x</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[#ff4e00] flex items-center justify-center shadow-[0_0_40px_rgba(255,78,0,0.5)]">
              <Volume2 className="w-10 h-10 text-white" />
            </div>
            <select 
              value={currentVoice} 
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest font-medium text-white/60 outline-none focus:ring-1 focus:ring-[#ff4e00]"
            >
              <option value="Aoede">Aoede</option>
              <option value="Kore">Kore</option>
              <option value="Zephyr">Zephyr</option>
              <option value="Fenrir">Fenrir</option>
              <option value="Puck">Puck</option>
              <option value="Charon">Charon</option>
            </select>
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-medium text-center">
              Aura Voice
            </span>
            <button 
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all mt-2",
                isScreenSharing ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
              )}
            >
              {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              {isScreenSharing ? "Stop Vision" : "Share Screen"}
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={onClose}
              className="p-6 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
            >
              <VolumeX className="w-8 h-8" />
            </button>
            <span className="text-[10px] uppercase tracking-widest text-white/60 font-medium text-center">
              Disconnect
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">Secure Neural Link Active</span>
        </div>
      </div>
    </motion.div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
