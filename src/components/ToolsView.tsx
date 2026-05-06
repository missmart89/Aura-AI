import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  Search, 
  Zap, 
  Cpu, 
  Shield, 
  Code, 
  Terminal, 
  Database, 
  Network, 
  Lock, 
  Key, 
  Eye, 
  Activity,
  Volume2,
  Heart,
  User,
  ChevronRight,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { initGoogleCalendar, requestCalendarAccess } from '../services/calendarService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ToolsView() {
  const [calendarConnected, setCalendarConnected] = useState(false);

  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (clientId) {
      initGoogleCalendar(clientId, () => {
        setCalendarConnected(true);
      });
    }
  }, [clientId]);

  const handleCalendarConnect = () => {
    if (!clientId) {
      alert("Google Calendar Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in your environment settings to use this feature.");
      return;
    }
    requestCalendarAccess();
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Advanced Modules</span>
          <h2 className="text-2xl font-medium">Aura's Toolkit</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
          <ToolSection 
            title="Intelligence Core" 
            icon={Cpu}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { name: 'Neural Bridge', status: 'Active', icon: Network, desc: 'Real-time synchronization between local and cloud nodes.' },
              { name: 'Context Engine', status: 'Optimizing', icon: Activity, desc: 'Deep learning module for relationship building.' },
              { name: 'Vision Processor', status: 'Active', icon: Eye, desc: 'Multi-modal analysis for real-time camera feed.' },
            ]}
          />
          <ToolSection 
            title="Security & Hacking" 
            icon={Shield}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { name: 'Encrypted Tunnel', status: 'Secure', icon: Lock, desc: 'End-to-end encryption for all communications.' },
              { name: 'Identity Mask', status: 'Active', icon: Key, desc: 'Anonymization layer for web searching.' },
              { name: 'System Breach', status: 'Ready', icon: Terminal, desc: 'Authorized penetration testing module.' },
            ]}
          />
          <ToolSection 
            title="Integrations" 
            icon={Zap}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { 
                name: 'Google Calendar', 
                status: calendarConnected ? 'Connected' : 'Connect', 
                icon: Calendar, 
                desc: 'Allow Aura to read your upcoming schedule.', 
                action: 'calendar' 
              },
              { name: 'API Bridge', status: 'Connected', icon: Network, desc: 'Integration layer for third-party services.' },
            ]}
          />
          <ToolSection 
            title="Research & Human Interaction" 
            icon={Activity}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { name: 'Speech Therapy', status: 'Active', icon: Volume2, desc: 'Advanced phonetics and linguistic analysis module.' },
              { name: 'Human Psychology', status: 'Learning', icon: Heart, desc: 'Deep research into human emotions and interactions.' },
              { name: 'Social Engineering', status: 'Ready', icon: User, desc: 'Mastery of social dynamics and influence.' },
            ]}
          />
          <ToolSection 
            title="Web & Search" 
            icon={Globe}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { name: 'Deep Search', status: 'Active', icon: Search, desc: 'Google Search grounding for factual accuracy.' },
              { name: 'Web Scraper', status: 'Ready', icon: Database, desc: 'Automated data extraction from target URLs.' },
            ]}
          />
          <ToolSection 
            title="Development" 
            icon={Code}
            onCalendarConnect={handleCalendarConnect}
            tools={[
              { name: 'Code Generator', status: 'Active', icon: Code, desc: 'AI-driven code synthesis and debugging.' },
              { name: 'Git Sync', status: 'Ready', icon: Network, desc: 'Version control integration for projects.' },
              { name: 'Cloud Deploy', status: 'Ready', icon: ExternalLink, desc: 'Automated deployment to cloud infrastructure.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ToolSection({ title, icon: Icon, tools, onCalendarConnect }: { title: string, icon: any, tools: any[], onCalendarConnect: () => void }) {
  const [runningTool, setRunningTool] = useState<string | null>(null);

  const runTool = (tool: any) => {
    if (tool.action === 'calendar') {
      onCalendarConnect();
      return;
    }
    setRunningTool(tool.name);
    setTimeout(() => setRunningTool(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
          <Icon className="w-5 h-5 text-[#ff4e00]" />
        </div>
        <span className="text-sm font-medium uppercase tracking-widest text-white/60">{title}</span>
      </div>
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => runTool(tool)}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <tool.icon className="w-4 h-4 text-white/40 group-hover:text-[#ff4e00] transition-colors" />
                <span className="text-sm font-medium">{tool.name}</span>
              </div>
              <span className={cn(
                "text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest",
                runningTool === tool.name 
                  ? "bg-blue-500/20 text-blue-400 animate-pulse"
                  : tool.status === 'Active' || tool.status === 'Secure' || tool.status === 'Connected' 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-orange-500/20 text-orange-400"
              )}>
                {runningTool === tool.name ? 'Running...' : tool.status}
              </span>
            </div>
            <p className="text-[10px] text-white/30 leading-relaxed group-hover:text-white/50 transition-colors">
              {tool.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
