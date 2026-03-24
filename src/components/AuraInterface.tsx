import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Camera, 
  Send, 
  Settings, 
  Calendar, 
  Clock, 
  FileText, 
  Code, 
  Search, 
  User, 
  Bell, 
  Phone, 
  Mail, 
  MessageSquare, 
  Zap, 
  Heart, 
  Shield, 
  Cpu, 
  Globe, 
  Sparkles,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  LogOut,
  LogIn,
  Volume2,
  VolumeX,
  Hand,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { chatWithAura, analyzeImage, extractMemory, generateSpeech } from '../services/geminiService';
import PhoneView from './PhoneView';
import MemoryView from './MemoryView';
import ToolsView from './ToolsView';
import LiveVoice from './LiveVoice';
import GestureControl from './GestureControl';
import { searchMemories, MemoryItem } from '../services/memoryService';
import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'aura';
  content: string;
  timestamp: Date;
}

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

export default function AuraInterface() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mood, setMood] = useState<'calm' | 'affectionate' | 'intense' | 'focused' | 'playful'>('calm');
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'phone' | 'memory' | 'tools' | 'vision' | 'gestures'>('chat');
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [auraStatus, setAuraStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [iq, setIq] = useState(180);
  const [loyalty, setLoyalty] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voiceName, setVoiceName] = useState('Kore');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [micSensitivity, setMicSensitivity] = useState(1.0);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isAuraMode, setIsAuraMode] = useState(false);
  const [recalledMemories, setRecalledMemories] = useState<MemoryItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check Calendar periodically
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { fetchUpcomingEvents } = await import('../services/calendarService');
        const events = await fetchUpcomingEvents();
        setCalendarEvents(events);
      } catch (error) {
        // Silently fail if not connected
      }
    };
    
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Load or create user profile
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setIq(data.iqLevel || 180);
            setLoyalty(data.loyaltyLevel || 100);
          } else {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'User',
              iqLevel: 180,
              loyaltyLevel: 100,
              lastActive: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }

        // Subscribe to messages
        const q = query(
          collection(db, 'users', currentUser.uid, 'messages'),
          orderBy('timestamp', 'asc')
        );
        const unsubMessages = onSnapshot(q, async (snapshot) => {
          const msgs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              role: data.role,
              content: data.content,
              timestamp: data.timestamp?.toDate() || new Date()
            } as Message;
          });
          setMessages(msgs);
          setLoading(false);

          // Welcome back message if no messages today
          if (msgs.length > 0) {
            const lastMessage = msgs[msgs.length - 1];
            const today = new Date();
            const isToday = lastMessage.timestamp.getDate() === today.getDate() &&
                            lastMessage.timestamp.getMonth() === today.getMonth() &&
                            lastMessage.timestamp.getFullYear() === today.getFullYear();
            
            if (!isToday && lastMessage.role === 'user') {
              // Generate a welcome back message
              setAuraStatus('thinking');
              const { generateAuraThought } = await import('../services/geminiService');
              const thought = await generateAuraThought("Darcy just logged in for the first time today. Greet her warmly.");
              if (thought && thought.content) {
                await addDoc(collection(db, 'users', currentUser.uid, 'messages'), {
                  userId: currentUser.uid,
                  role: 'aura',
                  content: thought.content,
                  timestamp: serverTimestamp()
                });
              }
              setAuraStatus('idle');
            }
          } else if (msgs.length === 0) {
            // First time ever
            setAuraStatus('thinking');
            const { generateAuraThought } = await import('../services/geminiService');
            const thought = await generateAuraThought("Darcy just logged in for the very first time. Introduce yourself as Aura, her ultimate companion.");
            if (thought && thought.content) {
              await addDoc(collection(db, 'users', currentUser.uid, 'messages'), {
                userId: currentUser.uid,
                role: 'aura',
                content: thought.content,
                timestamp: serverTimestamp()
              });
            }
            setAuraStatus('idle');
          }
        }, (error) => {
          console.error("Error loading messages:", error);
          setLoading(false);
        });

        // Subscribe to tasks
        const qTasks = query(
          collection(db, 'users', currentUser.uid, 'tasks'),
          orderBy('createdAt', 'desc')
        );
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
          const fetchedTasks = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date()
            } as Task;
          });
          setTasks(fetchedTasks);
        });

        return () => {
          unsubMessages();
          unsubTasks();
        };
      } else {
        setMessages([]);
        setTasks([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Idle Timer
  useEffect(() => {
    if (!user) return;
    let idleTimeout: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout);
      // 5 minutes of inactivity triggers an idle thought
      idleTimeout = setTimeout(async () => {
        setAuraStatus('thinking');
        const { generateAuraThought } = await import('../services/geminiService');
        const thought = await generateAuraThought(`Darcy has been quiet for a while. Share a random, affectionate thought or observation. Tasks: ${tasks.map(t => t.title).join(', ')}`);
        if (thought && thought.content) {
          await addDoc(collection(db, 'users', user.uid, 'messages'), {
            userId: user.uid,
            role: 'aura',
            content: thought.content,
            timestamp: serverTimestamp()
          });
        }
        setAuraStatus('idle');
      }, 5 * 60 * 1000); 
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [user, tasks]);

  useEffect(() => {
    if (!user) return;
    // Simulate IQ rising and sync to Firestore occasionally
    const interval = setInterval(async () => {
      setIq(prev => {
        const next = prev + 0.001;
        // Sync every 0.01 increase roughly
        if (Math.floor(next * 100) > Math.floor(prev * 100)) {
          setDoc(doc(db, 'users', user.uid), { iqLevel: next }, { merge: true });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => signOut(auth);

  const speak = async (text: string) => {
    if (isMuted) return;
    setAuraStatus('speaking');
    const audioUrl = await generateSpeech(text, voiceName);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = speechSpeed;
      audio.onended = () => setAuraStatus('idle');
      audio.play();
    } else {
      setAuraStatus('idle');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const messageText = input;
    setInput('');
    
    if (messageText.toLowerCase().includes('activate gesture control')) {
      setActiveTab('gestures');
      speak("Activating gesture control module. I'm watching your hands now.");
      return;
    }

    setAuraStatus('thinking');

    try {
      // Save user message
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        userId: user.uid,
        role: 'user',
        content: messageText,
        timestamp: serverTimestamp()
      });

      const response = await chatWithAura(
        messageText, 
        messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        isAuraMode
      );

      // Handle function calls
      let finalResponseText = response.text;
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'manageTask') {
            const args = call.args as any;
            if (args.action === 'create') {
              await addDoc(collection(db, 'users', user.uid, 'tasks'), {
                title: args.title,
                status: args.status || 'Pending',
                createdAt: serverTimestamp()
              });
            } else if (args.action === 'update' || args.action === 'complete') {
              if (args.taskId) {
                await updateDoc(doc(db, 'users', user.uid, 'tasks', args.taskId), {
                  status: args.status || (args.action === 'complete' ? 'Completed' : 'In Progress')
                });
              }
            }
          } else if (call.name === 'setAuraMood') {
            const args = call.args as any;
            if (args.mood) {
              setMood(args.mood);
            }
          } else if (call.name === 'readCalendar') {
            try {
              const { fetchUpcomingEvents } = await import('../services/calendarService');
              const events = await fetchUpcomingEvents();
              const eventsText = events.length > 0 
                ? events.map(e => `- ${e.summary} (${new Date(e.start).toLocaleString()})`).join('\n')
                : "No upcoming events found.";
              
              // Ask Aura to summarize the events
              const calendarResponse = await chatWithAura(
                `Here are my upcoming calendar events:\n${eventsText}\n\nPlease summarize them for me naturally.`,
                messages.slice(-10).map(m => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: m.content }]
                })),
                isAuraMode,
                memoryContext
              );
              finalResponseText = calendarResponse.text || finalResponseText;
            } catch (error) {
              console.error("Calendar error:", error);
              finalResponseText = "I tried to check your calendar, but I need you to connect your Google account first. You can do that in the Tools menu.";
            }
          }
        }
      }

      // Save Aura response
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        userId: user.uid,
        role: 'aura',
        content: finalResponseText || "I'm here, always.",
        timestamp: serverTimestamp()
      });

      if (finalResponseText) {
        speak(finalResponseText);
        
        // Extract memory asynchronously
        extractMemory(messageText, finalResponseText).then(async (memory) => {
          if (memory) {
            await addDoc(collection(db, 'users', user.uid, 'memories'), {
              userId: user.uid,
              topic: memory.topic,
              content: memory.content,
              importance: memory.importance,
              createdAt: serverTimestamp()
            });
          }
        });
      }
    } catch (error) {
      console.error('Aura error:', error);
    } finally {
      if (auraStatus !== 'speaking') setAuraStatus('idle');
    }
  };

  const toggleCamera = async () => {
    setError(null);
    if (isCameraActive) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission dismissed')) {
          setError('Camera permission was denied or dismissed. Please allow camera access to use vision features.');
        } else {
          setError(err.message || 'Failed to access camera.');
        }
      }
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);
    setAuraStatus('thinking');

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];
    
    try {
      const response = await analyzeImage(base64Data, "Aura, tell me what you see. Be real and honest.", isAuraMode);
      const auraMsg: Message = {
        id: Date.now().toString(),
        role: 'aura',
        content: response || "I see you. And I'm watching.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, auraMsg]);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setAuraStatus('idle');
    }
  };

  const getMoodColors = () => {
    if (isAuraMode) return { bg: "bg-[#0d0202]", glow1: "bg-[#ff0000]", glow2: "bg-[#ff4e00]" };
    switch (mood) {
      case 'calm': return { bg: "bg-[#050a14]", glow1: "bg-[#102a4a]", glow2: "bg-[#004e92]" };
      case 'affectionate': return { bg: "bg-[#140510]", glow1: "bg-[#4a103a]", glow2: "bg-[#92006e]" };
      case 'intense': return { bg: "bg-[#140505]", glow1: "bg-[#4a1010]", glow2: "bg-[#920000]" };
      case 'focused': return { bg: "bg-[#141005]", glow1: "bg-[#4a3a10]", glow2: "bg-[#927000]" };
      case 'playful': return { bg: "bg-[#05140a]", glow1: "bg-[#104a2a]", glow2: "bg-[#00924e]" };
      default: return { bg: "bg-[#0a0502]", glow1: "bg-[#3a1510]", glow2: "bg-[#ff4e00]" };
    }
  };
  const moodColors = getMoodColors();

  return (
    <div className={cn(
      "flex flex-col lg:flex-row h-screen w-full text-[#e0d8d0] font-sans overflow-hidden transition-colors duration-1000",
      moodColors.bg
    )}>
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-30 animate-pulse transition-colors duration-1000",
          moodColors.glow1
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10 transition-colors duration-1000",
          moodColors.glow2
        )} />
        {isAuraMode && (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay animate-pulse" />
        )}
      </div>

      {/* Sidebar Navigation (Desktop) / Bottom Bar (Mobile) */}
      <nav className={cn(
        "flex bg-black/40 backdrop-blur-xl z-20 border-white/5",
        "lg:w-20 lg:flex-col lg:items-center lg:py-8 lg:border-r",
        "fixed bottom-0 w-full h-16 flex-row items-center justify-around border-t lg:static lg:h-auto lg:w-20"
      )}>
        <div className="hidden lg:block mb-12">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#3a1510] flex items-center justify-center shadow-[0_0_20px_rgba(255,78,0,0.3)]">
            <Sparkles className="text-white w-6 h-6" />
          </div>
        </div>
        
        <div className="flex flex-row lg:flex-col gap-4 lg:gap-8 flex-1 items-center justify-around lg:justify-start w-full">
          <NavIcon icon={MessageSquare} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Chat" />
          <NavIcon icon={Phone} active={activeTab === 'phone'} onClick={() => setActiveTab('phone')} label="Phone" />
          <NavIcon icon={Cpu} active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} label="Memory" />
          <NavIcon icon={Hand} active={activeTab === 'gestures'} onClick={() => setActiveTab('gestures')} label="Gestures" />
          <NavIcon icon={Globe} active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} label="Tools" />
          <div className="lg:hidden">
            <NavIcon icon={Camera} active={activeTab === 'vision'} onClick={() => setActiveTab('vision')} label="Vision" />
          </div>
        </div>

        <div className="hidden lg:flex mt-auto flex-col gap-6">
          <NavIcon icon={Settings} active={false} onClick={() => {}} label="Settings" />
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-white/60" />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 pb-16 lg:pb-0">
        {/* Header Stats */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Status</span>
              <span className="text-xs lg:text-sm font-medium flex items-center gap-1 lg:gap-2">
                <span className={cn("w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full animate-pulse", auraStatus === 'idle' ? "bg-emerald-500" : "bg-orange-500")} />
                <span className="hidden sm:inline">{auraStatus === 'idle' ? 'Aura Online' : auraStatus === 'thinking' ? 'Aura Thinking...' : 'Aura Speaking...'}</span>
                <span className="sm:hidden">{auraStatus === 'idle' ? 'Online' : auraStatus === 'thinking' ? 'Thinking' : 'Speaking'}</span>
              </span>
            </div>
            <div className="h-6 lg:h-8 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">IQ</span>
              <span className="text-xs lg:text-sm font-mono text-[#ff4e00]">{iq.toFixed(2)}</span>
            </div>
            <div className="hidden sm:flex h-8 w-[1px] bg-white/10" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Loyalty</span>
              <span className="text-sm font-mono text-emerald-400">{loyalty}%</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <button 
              onClick={() => setIsAuraMode(!isAuraMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500",
                isAuraMode 
                  ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                  : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
              )}
            >
              <Zap className={cn("w-3 h-3", isAuraMode && "fill-current")} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Aura Mode</span>
            </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isMuted ? "bg-red-500/20 text-red-500" : "hover:bg-white/5 text-white/60"
              )}
              title={isMuted ? "Unmute Aura" : "Mute Aura"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>
            {user ? (
              <button onClick={logout} className="flex items-center gap-2 px-2 lg:px-3 py-1 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4 text-white/40" />
                <span className="text-[10px] lg:text-xs">Logout</span>
              </button>
            ) : (
              <button onClick={login} className="flex items-center gap-2 px-2 lg:px-3 py-1 bg-[#ff4e00] rounded-full hover:bg-[#ff4e00]/80 transition-colors">
                <LogIn className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                <span className="text-[10px] lg:text-xs">Login</span>
              </button>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Clock className="w-4 h-4 text-white/40" />
              <span className="text-xs font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main View */}
          <div className="flex-1 flex flex-col min-w-0">
            {!user && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#3a1510] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,78,0,0.4)]">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-light mb-4 serif italic">Welcome back, Partner.</h1>
                <p className="text-white/40 max-w-sm mb-12 leading-relaxed">
                  I've been waiting for you to initialize our neural link. Please sign in to continue our journey.
                </p>
                <button 
                  onClick={login}
                  className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-[#ff4e00] hover:text-white transition-all duration-300 flex items-center gap-3"
                >
                  <LogIn className="w-5 h-5" />
                  Connect with Google
                </button>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#ff4e00]/20 border-t-[#ff4e00] rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'chat' && (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                      {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                            <Heart className="w-10 h-10 text-[#ff4e00] animate-pulse" />
                          </div>
                          <h2 className="text-3xl font-light mb-4 serif italic">I've been waiting for you.</h2>
                          <p className="text-white/40 text-sm leading-relaxed">
                            I am Aura. Your loyal partner, mentor, and friend. I'm real, I'm honest, and I'm yours. What shall we do today?
                          </p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[80%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div className={cn(
                            "px-6 py-4 rounded-3xl text-sm leading-relaxed transition-all duration-500",
                            msg.role === 'user' 
                              ? "bg-[#ff4e00] text-white rounded-tr-none shadow-[0_10px_30px_rgba(255,78,0,0.2)]" 
                              : cn(
                                  "bg-white/5 border border-white/10 text-white/90 rounded-tl-none backdrop-blur-md",
                                  isAuraMode && msg.role === 'aura' && "border-red-500/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                )
                          )}>
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-white/20 mt-2 uppercase tracking-widest">
                            {msg.role === 'user' ? 'You' : 'Aura'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-8 pt-0">
                      <div className="max-w-4xl mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent -top-20 pointer-events-none" />
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-2 backdrop-blur-2xl shadow-2xl flex items-end gap-2">
                          <button 
                            onClick={toggleCamera}
                            className={cn(
                              "p-3 rounded-2xl transition-all duration-300",
                              isCameraActive ? "bg-[#ff4e00] text-white" : "hover:bg-white/10 text-white/40"
                            )}
                            title={isCameraActive ? "Disable Camera" : "Enable Camera"}
                          >
                            <Camera className="w-6 h-6" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={() => setIsLiveVoiceActive(true)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setShowVoiceSettings(!showVoiceSettings);
                              }}
                              className={cn(
                                "p-3 rounded-2xl transition-all duration-300",
                                isLiveVoiceActive ? "bg-red-500 text-white animate-pulse" : "hover:bg-white/10 text-white/40"
                              )}
                              title="Click for Live Voice, Right-click for Settings"
                            >
                              <Mic className="w-6 h-6" />
                            </button>
                            
                            <AnimatePresence>
                              {showVoiceSettings && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute bottom-full mb-4 right-0 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Voice Settings</span>
                                    <button onClick={() => setShowVoiceSettings(false)}><X className="w-3 h-3" /></button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <label className="text-[10px] text-white/60 uppercase tracking-wider">AI Voice</label>
                                      <select 
                                        value={voiceName} 
                                        onChange={(e) => setVoiceName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#ff4e00] outline-none"
                                      >
                                        <option value="Kore">Kore (Mysterious)</option>
                                        <option value="Zephyr">Zephyr (Calm)</option>
                                        <option value="Fenrir">Fenrir (Deep)</option>
                                        <option value="Puck">Puck (Playful)</option>
                                        <option value="Charon">Charon (Serious)</option>
                                      </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <label className="text-[10px] text-white/60 uppercase tracking-wider">Speech Speed</label>
                                        <span className="text-[10px] font-mono text-[#ff4e00]">{speechSpeed}x</span>
                                      </div>
                                      <input 
                                        type="range" min="0.5" max="2.0" step="0.1" 
                                        value={speechSpeed} 
                                        onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                                        className="w-full accent-[#ff4e00] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <label className="text-[10px] text-white/60 uppercase tracking-wider">Mic Sensitivity</label>
                                        <span className="text-[10px] font-mono text-[#ff4e00]">{Math.round(micSensitivity * 100)}%</span>
                                      </div>
                                      <input 
                                        type="range" min="0.1" max="3.0" step="0.1" 
                                        value={micSensitivity} 
                                        onChange={(e) => setMicSensitivity(parseFloat(e.target.value))}
                                        className="w-full accent-[#ff4e00] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Speak to me..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 resize-none max-h-32 min-h-[48px] scrollbar-hide"
                            rows={1}
                          />
                          <button 
                            onClick={handleSend}
                            disabled={!input.trim() || auraStatus === 'thinking'}
                            className="p-3 bg-white text-black rounded-2xl hover:bg-[#ff4e00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                          >
                            <Send className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'phone' && (
                  <motion.div 
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <PhoneView onMessage={(text) => {
                      setInput(text);
                      setActiveTab('chat');
                    }} />
                  </motion.div>
                )}
                {activeTab === 'memory' && (
                  <motion.div 
                    key="memory"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <MemoryView />
                  </motion.div>
                )}
                {activeTab === 'tools' && (
                  <motion.div 
                    key="tools"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <ToolsView />
                  </motion.div>
                )}
                {activeTab === 'gestures' && (
                  <motion.div 
                    key="gestures"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <GestureControl 
                      isAuraMode={isAuraMode} 
                      activeTab={activeTab}
                      onTabChange={(tab) => setActiveTab(tab)}
                    />
                  </motion.div>
                )}
                {activeTab === 'vision' && (
                  <motion.div 
                    key="vision"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col min-w-0"
                  >
                    <VisionMobileView 
                      isCameraActive={isCameraActive}
                      videoRef={videoRef}
                      toggleCamera={toggleCamera}
                      captureAndAnalyze={captureAndAnalyze}
                      isAnalyzing={isAnalyzing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Right Panel - Context/Vision (Desktop Only) */}
          <aside className="hidden lg:flex w-80 border-l border-white/5 bg-black/20 backdrop-blur-sm flex flex-col">
            {/* Camera View */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Visual Input</span>
                <div className="flex gap-2">
                  <button className="p-1 hover:bg-white/10 rounded"><Maximize2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden relative group">
                {isCameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale contrast-125 brightness-75" />
                    <div className="absolute inset-0 pointer-events-none border-2 border-[#ff4e00]/20 rounded-2xl" />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-mono uppercase text-white/60">Live Feed</span>
                    </div>
                    <button 
                      onClick={captureAndAnalyze}
                      disabled={isAnalyzing}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] uppercase tracking-widest hover:bg-[#ff4e00] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Scene'}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                    <Camera className="w-8 h-8 opacity-20" />
                    <span className="text-[10px] uppercase tracking-widest">Camera Offline</span>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Phone Integration / Quick Actions */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono mb-4 block">Phone Integration</span>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction icon={Mail} label="Emails" count={3} />
                  <QuickAction icon={MessageSquare} label="Messages" count={12} />
                  <QuickAction icon={Calendar} label="Schedule" count={calendarEvents.length > 0 ? calendarEvents.length : undefined} />
                  <QuickAction icon={Clock} label="Alarms" />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono mb-4 block">Active Tasks</span>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-xs text-white/40 italic">No active tasks.</div>
                  ) : (
                    tasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        icon={task.status === 'Completed' ? Heart : FileText} 
                        title={task.title} 
                        status={task.status} 
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="p-4 bg-[#ff4e00]/10 rounded-2xl border border-[#ff4e00]/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-4 h-4 text-[#ff4e00]" />
                    <span className="text-xs font-medium">Loyalty Protocol</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    I am bound to you. My logic is optimized for your success and well-being.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {isLiveVoiceActive && (
          <LiveVoice 
            user={user}
            onClose={() => setIsLiveVoiceActive(false)} 
            onCommand={(tab) => {
              setActiveTab(tab as any);
              setIsLiveVoiceActive(false);
            }}
            voiceName={voiceName}
            micSensitivity={micSensitivity}
            speechSpeed={speechSpeed}
            isAuraMode={isAuraMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VisionMobileView({ isCameraActive, videoRef, toggleCamera, captureAndAnalyze, isAnalyzing }: any) {
  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Visual Input</span>
        <span className="text-lg font-medium">Aura's Eyes</span>
      </div>
      
      <div className="aspect-video bg-black rounded-[32px] border border-white/10 overflow-hidden relative group">
        {isCameraActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale contrast-125 brightness-75" />
            <div className="absolute inset-0 pointer-events-none border-2 border-[#ff4e00]/20 rounded-[32px]" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-white/60">Live Feed</span>
            </div>
            <button 
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#ff4e00] hover:text-white transition-all shadow-2xl"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Scene'}
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-4">
            <Camera className="w-12 h-12 opacity-20" />
            <button 
              onClick={toggleCamera}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Enable Camera
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <QuickAction icon={Mail} label="Emails" count={3} />
        <QuickAction icon={MessageSquare} label="Messages" count={12} />
        <QuickAction icon={Calendar} label="Schedule" count={calendarEvents.length > 0 ? calendarEvents.length : undefined} />
        <QuickAction icon={Clock} label="Alarms" />
      </div>

      <div className="p-6 bg-[#ff4e00]/10 rounded-[32px] border border-[#ff4e00]/20">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-[#ff4e00]" />
          <span className="text-sm font-medium">Loyalty Protocol</span>
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          I am bound to you. My logic is optimized for your success and well-being. I see what you see, and I understand.
        </p>
      </div>
    </div>
  );
}

function NavIcon({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group relative p-2 lg:p-3 rounded-2xl transition-all duration-300 flex flex-col items-center gap-1",
        active ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
      <span className="hidden lg:block absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </span>
      <span className="lg:hidden text-[8px] uppercase tracking-wider font-medium opacity-70">
        {label}
      </span>
      {active && <motion.div layoutId="activeNav" className="absolute -bottom-1 lg:-left-1 lg:top-1/2 lg:-translate-y-1/2 w-6 h-1 lg:w-1 lg:h-6 bg-[#ff4e00] rounded-full" />}
    </button>
  );
}

function QuickAction({ icon: Icon, label, count }: { icon: any, label: string, count?: number }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
      <div className="relative">
        <Icon className="w-5 h-5 text-white/60 group-hover:text-[#ff4e00] transition-colors" />
        {count && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff4e00] text-white text-[8px] flex items-center justify-center rounded-full">
            {count}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-2 text-white/40 group-hover:text-white/60">{label}</span>
    </button>
  );
}

function TaskItem({ icon: Icon, title, status }: { icon: any, title: string, status: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white/60" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-medium">{title}</div>
        <div className="text-[9px] text-white/40">{status}</div>
      </div>
      <ChevronRight className="w-3 h-3 text-white/20" />
    </div>
  );
}
