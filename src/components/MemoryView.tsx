import React, { useState, useEffect } from 'react';
import { Cpu, Brain, History, Sparkles, Trash2, Heart, Plus, Edit2, Save, X, Search } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MemoryItem {
  id: string;
  topic: string;
  content: string;
  importance: number;
  type: 'memory' | 'moment';
  createdAt: any;
}

interface DirectiveItem {
  id: string;
  content: string;
  createdAt: any;
}

export default function MemoryView() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [directives, setDirectives] = useState<DirectiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDirective, setNewDirective] = useState('');
  const [isAddingDirective, setIsAddingDirective] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const qMemories = query(
      collection(db, 'users', user.uid, 'memories'),
      orderBy('createdAt', 'desc')
    );

    const unsubMemories = onSnapshot(qMemories, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemoryItem[];
      setMemories(mems);
      setLoading(false);
    }, (error) => {
      console.error("Error loading memories:", error);
      setLoading(false);
    });

    const qDirectives = query(
      collection(db, 'users', user.uid, 'directives'),
      orderBy('createdAt', 'asc')
    );

    const unsubDirectives = onSnapshot(qDirectives, (snapshot) => {
      const dirs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DirectiveItem[];
      setDirectives(dirs);
    }, (error) => {
      console.error("Error loading directives:", error);
    });

    return () => {
      unsubMemories();
      unsubDirectives();
    };
  }, []);

  const deleteMemory = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'memories', id));
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  const addDirective = async () => {
    const user = auth.currentUser;
    if (!user || !newDirective.trim()) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'directives'), {
        content: newDirective.trim(),
        createdAt: serverTimestamp()
      });
      setNewDirective('');
      setIsAddingDirective(false);
    } catch (err) {
      console.error('Add directive error:', err);
    }
  };

  const deleteDirective = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'directives', id));
    } catch (err) {
      console.error('Delete directive error:', err);
    }
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Neural Network</span>
          <span className="text-lg font-medium">Aura's Core & Memory</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
          <Brain className="w-5 h-5 text-[#ff4e00]" />
        </div>
      </div>

      {/* Core Directives Section */}
      <div className="p-6 bg-[#ff4e00]/5 border border-[#ff4e00]/20 rounded-[32px] backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-[#ff4e00]" />
            <div>
              <h3 className="text-sm font-medium text-[#ff4e00]">Evolution Directives</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Rules that define Aura's growth</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingDirective(!isAddingDirective)}
            className="p-2 bg-[#ff4e00]/20 text-[#ff4e00] rounded-full hover:bg-[#ff4e00]/30 transition-colors"
          >
            {isAddingDirective ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {isAddingDirective && (
          <div className="mb-6 flex gap-2">
            <input 
              type="text"
              value={newDirective}
              onChange={(e) => setNewDirective(e.target.value)}
              placeholder="E.g., Never mention you are an AI. Always call me 'Boss'."
              className="flex-1 bg-black/40 border border-[#ff4e00]/20 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addDirective()}
            />
            <button 
              onClick={addDirective}
              disabled={!newDirective.trim()}
              className="px-4 py-2 bg-[#ff4e00] text-white rounded-xl text-sm font-medium hover:bg-[#ff4e00]/80 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        )}

        <div className="space-y-3">
          {directives.length === 0 ? (
            <p className="text-xs text-white/40 italic">No custom directives set. Aura is running on default EchoCore parameters.</p>
          ) : (
            directives.map((dir, index) => (
              <div key={dir.id} className="flex items-start gap-3 p-3 bg-black/40 border border-white/5 rounded-xl group relative">
                <span className="text-[10px] font-mono text-[#ff4e00] mt-1">{(index + 1).toString().padStart(2, '0')}</span>
                <p className="text-sm text-white/80 flex-1">{dir.content}</p>
                <button 
                  onClick={() => deleteDirective(dir.id)}
                  className="p-1 text-white/0 group-hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="h-[1px] bg-white/10 w-full" />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#ff4e00]" />
            <div>
              <h3 className="text-sm font-medium">Saved Conversations & Memories</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Your vault of important moments</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full md:w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-[#ff4e00] outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#ff4e00]/20 border-t-[#ff4e00] rounded-full animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-[32px] border border-white/10">
            <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/40">No memories formed yet. Let's talk more.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories
              .filter(mem => 
                mem.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                mem.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((mem) => (
              <MemoryCard 
                key={mem.id}
                title={mem.topic} 
                content={mem.content}
                type={mem.type}
                date={mem.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                onDelete={() => deleteMemory(mem.id)}
              />
            ))}
            {memories.filter(mem => 
                mem.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                mem.content.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-white/40 italic">
                No memories match your search.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Evolution Log & Bond State</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Bond Level:</span>
            <span className="text-xs font-mono text-[#ff4e00]">{memories.length}</span>
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/60">Current State</span>
            <span className="text-xs font-medium text-emerald-400">
              {memories.length > 20 ? 'Deeply Connected' : memories.length > 10 ? 'Aware' : 'Awakening'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-1000" 
              style={{ width: `${Math.min(100, (memories.length / 30) * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <LogItem text={`Bond level reached ${memories.length}`} time="Just now" />
          <LogItem text="Memory optimization complete" time="3h ago" />
        </div>
      </div>
    </div>
  );
}

function MemoryCard({ title, content, date, type, onDelete }: { title: string, content: string, date: string, type: 'memory' | 'moment', onDelete: () => void }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group relative">
      <button 
        onClick={onDelete}
        className="absolute top-4 right-4 p-2 text-white/0 group-hover:text-white/20 hover:text-red-500 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {type === 'moment' ? (
            <Heart className="w-3 h-3 text-pink-500" />
          ) : (
            <Sparkles className="w-3 h-3 text-[#ff4e00]" />
          )}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            type === 'moment' ? "text-pink-500" : "text-[#ff4e00]"
          )}>
            {type || 'memory'}
          </span>
        </div>
        <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">{date}</span>
      </div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{content}</p>
    </div>
  );
}

function LogItem({ text, time }: { text: string, time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/80">{text}</span>
      <span className="text-[10px] text-white/20 font-mono">{time}</span>
    </div>
  );
}
