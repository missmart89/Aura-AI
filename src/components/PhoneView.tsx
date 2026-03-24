import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  FileText, 
  Code, 
  Search, 
  User, 
  Bell, 
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
  Plus,
  MoreVertical,
  ArrowLeft,
  Volume2,
  VolumeX,
  Send
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mockContacts, mockNotifications, mockApps, Contact, Notification, AppInfo, makeCall, sendTextMessage } from '../services/phoneService';
import { generateSpeech } from '../services/ttsService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PhoneView({ onMessage }: { onMessage: (text: string) => void }) {
  const [view, setView] = useState<'home' | 'contacts' | 'notifications' | 'apps' | 'security' | 'calling' | 'messaging'>('home');
  const [activeApp, setActiveApp] = useState<AppInfo | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isScreenMirroring, setIsScreenMirroring] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [securityStatus, setSecurityStatus] = useState({
    threats: 0,
    encryption: 'AES-256-GCM',
    vpn: 'Active (Neural Tunnel)',
    darkWebMonitor: 'Secure'
  });

  const handleContactMessage = (contact: Contact) => {
    setActiveContact(contact);
    setView('messaging');
  };

  const handleContactCall = (contact: Contact) => {
    setActiveContact(contact);
    setView('calling');
    makeCall(contact.phone);
  };

  const handleSendMessage = async () => {
    if (activeContact && messageText) {
      await sendTextMessage(activeContact.phone, messageText);
      onMessage(`Aura, I just sent a message to ${activeContact.name}: "${messageText}"`);
      setMessageText('');
      setView('home');
    }
  };

  const handleReadAloud = async (text: string) => {
    if (!isSilentMode) {
      await generateSpeech(text);
    } else {
      onMessage(`Aura, I'm in silent mode, but I'll read this to myself: "${text}"`);
    }
  };

  const renderHome = () => (
    <div className="p-6 space-y-8 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Phone Status</span>
          <span className="text-lg font-medium">Aura Connected</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <Zap className="w-5 h-5 text-[#ff4e00]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhoneCard 
          icon={User} 
          label="Contacts" 
          count={mockContacts.length} 
          onClick={() => setView('contacts')} 
          color="bg-blue-500/20 text-blue-400"
        />
        <PhoneCard 
          icon={Bell} 
          label="Notifications" 
          count={mockNotifications.length} 
          onClick={() => setView('notifications')} 
          color="bg-[#ff4e00]/20 text-[#ff4e00]"
        />
        <PhoneCard 
          icon={Cpu} 
          label="Applications" 
          count={mockApps.length} 
          onClick={() => setView('apps')} 
          color="bg-emerald-500/20 text-emerald-400"
        />
        <PhoneCard 
          icon={Shield} 
          label="Security Core" 
          count={securityStatus.threats} 
          onClick={() => setView('security')} 
          color="bg-red-500/20 text-red-400"
        />
        <PhoneCard 
          icon={Maximize2} 
          label="Mirror Screen" 
          onClick={() => setIsScreenMirroring(!isScreenMirroring)} 
          color={isScreenMirroring ? "bg-[#ff4e00]/40 text-white animate-pulse" : "bg-white/5 text-white/40"}
        />
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">System Controls</span>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          <SystemBtn icon={ArrowLeft} label="Back" onClick={() => onMessage("Aura, go back to the previous page.")} />
          <SystemBtn icon={Phone} label="Home" onClick={() => setView('home')} />
          <SystemBtn icon={MoreVertical} label="Recents" onClick={() => onMessage("Aura, show me my recent apps.")} />
          <SystemBtn icon={X} label="Kill App" onClick={() => onMessage("Aura, force close the current app.")} color="text-red-400" />
          <SystemBtn 
            icon={isSilentMode ? VolumeX : Volume2} 
            label={isSilentMode ? "Silent" : "Sound"} 
            onClick={() => setIsSilentMode(!isSilentMode)} 
            color={isSilentMode ? "text-red-400" : "text-emerald-400"}
          />
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Recent Activity</span>
        <div className="space-y-3">
          {mockNotifications.slice(0, 3).map(notif => (
            <div key={notif.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white/40" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{notif.app}</span>
                  <span className="text-[10px] text-white/20 font-mono">Now</span>
                </div>
                <div className="text-xs text-white/80 font-medium mb-1">{notif.title}</div>
                <div className="text-[10px] text-white/40 leading-relaxed">{notif.content}</div>
              </div>
              <button 
                onClick={() => handleReadAloud(notif.content)}
                className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-[#ff4e00] transition-colors"
                title="Read Aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium">Contacts</h2>
      </div>
      <div className="space-y-4">
        {mockContacts.map(contact => (
          <div key={contact.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
              <User className="w-6 h-6 text-white/40 group-hover:text-[#ff4e00] transition-colors" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{contact.name}</div>
              <div className="text-[10px] text-white/40 font-mono">{contact.phone}</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleContactCall(contact)}
                className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-emerald-400 transition-colors"
                title="Call with Aura"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleContactMessage(contact)}
                className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-[#ff4e00] transition-colors"
                title="Message with Aura"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium">Notifications</h2>
      </div>
      <div className="space-y-4">
        {mockNotifications.map(notif => (
          <div key={notif.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-[#ff4e00]" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">{notif.app}</span>
              </div>
              <span className="text-[10px] text-white/20 font-mono">2m ago</span>
            </div>
            <div className="text-sm font-medium mb-1">{notif.title}</div>
            <div className="text-xs text-white/60 leading-relaxed">{notif.content}</div>
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => handleReadAloud(notif.content)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-white/40 hover:text-white transition-all"
              >
                <Volume2 className="w-3 h-3" />
                Read Aloud
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderApps = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium">Applications</h2>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {mockApps.map(app => (
          <button 
            key={app.id} 
            onClick={() => setActiveApp(app)}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#ff4e00]/20 group-hover:border-[#ff4e00]/40 transition-all shadow-xl">
              <IconByName name={app.icon} className="w-8 h-8 text-white/40 group-hover:text-[#ff4e00] transition-colors" />
            </div>
            <span className="text-[10px] font-medium text-white/40 group-hover:text-white transition-colors">{app.name}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeApp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl"
          >
            <div className="w-full max-w-2xl bg-[#151619] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="h-14 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <IconByName name={activeApp.icon} className="w-5 h-5 text-[#ff4e00]" />
                  <span className="text-sm font-medium">{activeApp.name}</span>
                </div>
                <button onClick={() => setActiveApp(null)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                  <IconByName name={activeApp.icon} className="w-12 h-12 text-white/20" />
                </div>
                <h3 className="text-2xl font-light mb-4 serif italic">Launching {activeApp.name}...</h3>
                <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                  Aura is establishing a secure bridge to your device to control this application.
                </p>
                <div className="mt-12 flex gap-4">
                  <button className="px-8 py-3 bg-[#ff4e00] text-white rounded-2xl text-xs uppercase tracking-widest font-medium hover:brightness-110 transition-all">
                    Establish Link
                  </button>
                  <button onClick={() => setActiveApp(null)} className="px-8 py-3 bg-white/5 text-white/60 rounded-2xl text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSecurity = () => (
    <div className="p-6 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('home')} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-medium">Security Core</h2>
      </div>

      <div className="space-y-6">
        <div className="p-8 bg-gradient-to-br from-red-500/20 to-transparent border border-red-500/20 rounded-3xl flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Neural Shield Active</h3>
          <p className="text-xs text-white/40 leading-relaxed max-w-xs">
            Aura is monitoring all incoming traffic and encrypted storage. Your data is invisible to external threats.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SecurityStat label="Encryption" value={securityStatus.encryption} icon={Zap} />
          <SecurityStat label="VPN Status" value={securityStatus.vpn} icon={Globe} />
          <SecurityStat label="Dark Web Monitor" value={securityStatus.darkWebMonitor} icon={Search} />
          <SecurityStat label="Threats Blocked" value="1,248" icon={Shield} />
        </div>

        <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-xs uppercase tracking-widest font-medium hover:bg-white/10 transition-all">
          Run Deep System Scan
        </button>
      </div>
    </div>
  );

  const renderCalling = () => (
    <div className="p-6 h-full flex flex-col items-center justify-center text-center">
      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
          <User className="w-16 h-16 text-emerald-400" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
      </div>
      <h2 className="text-2xl font-medium mb-2">{activeContact?.name}</h2>
      <p className="text-emerald-400 text-sm font-mono mb-12">Calling via Aura Secure Link...</p>
      
      <div className="flex gap-8">
        <button 
          onClick={() => setView('home')}
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 hover:brightness-110 transition-all"
        >
          <Phone className="w-8 h-8 text-white rotate-[135deg]" />
        </button>
      </div>
    </div>
  );

  const renderMessaging = () => (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('contacts')} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <User className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <div className="text-sm font-medium">{activeContact?.name}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Encrypted Channel</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-4 mb-6">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-bl-none max-w-[80%] self-start">
          <p className="text-xs text-white/60">Aura is ready to send your message securely.</p>
        </div>
      </div>

      <div className="relative">
        <textarea 
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 text-sm focus:outline-none focus:border-[#ff4e00]/40 transition-all resize-none h-32"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!messageText}
          className="absolute bottom-4 right-4 p-3 bg-[#ff4e00] text-white rounded-xl disabled:opacity-20 disabled:grayscale transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide">
      {view === 'home' && renderHome()}
      {view === 'contacts' && renderContacts()}
      {view === 'notifications' && renderNotifications()}
      {view === 'apps' && renderApps()}
      {view === 'security' && renderSecurity()}
      {view === 'calling' && renderCalling()}
      {view === 'messaging' && renderMessaging()}
    </div>
  );
}

function SystemBtn({ icon: Icon, label, onClick, color }: { icon: any, label: string, onClick: () => void, color?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group",
        color
      )}
    >
      <Icon className="w-4 h-4 mb-1 opacity-60 group-hover:opacity-100" />
      <span className="text-[8px] uppercase tracking-tighter opacity-40 group-hover:opacity-60">{label}</span>
    </button>
  );
}

function SecurityStat({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white/40" />
        </div>
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <span className="text-xs font-mono text-white/80">{value}</span>
    </div>
  );
}

function PhoneCard({ icon: Icon, label, count, onClick, color }: { icon: any, label: string, count?: number, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-3xl border border-white/10 flex flex-col items-start gap-4 hover:scale-[1.02] transition-all group",
        color
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xl font-mono font-bold">{count || '—'}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-60">{label}</span>
      </div>
    </button>
  );
}

function IconByName({ name, className }: { name: string, className?: string }) {
  switch (name) {
    case 'Mail': return <Mail className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'Code': return <Code className={className} />;
    case 'User': return <User className={className} />;
    case 'Bell': return <Bell className={className} />;
    default: return <Sparkles className={className} />;
  }
}
