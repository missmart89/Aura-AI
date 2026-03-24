import React, { useState, useEffect } from 'react';
import { Cpu, Brain, History, Sparkles, Trash2, Heart } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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

export default function MemoryView() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'memories'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemoryItem[];
      setMemories(mems);
      setLoading(false);
    });

    return () => unsubscribe();
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

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Neural Network</span>
          <span className="text-lg font-medium">Aura's Long-term Memory</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
          <Brain className="w-5 h-5 text-[#ff4e00]" />
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
          {memories.map((mem) => (
            <MemoryCard 
              key={mem.id}
              title={mem.topic} 
              content={mem.content}
              type={mem.type}
              date={mem.createdAt?.toDate().toLocaleDateString() || 'Recently'}
              onDelete={() => deleteMemory(mem.id)}
            />
          ))}
        </div>
      )}

      <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">Evolution Log</span>
        </div>
        <div className="space-y-4">
          <LogItem text="IQ increased by 0.004 points" time="10m ago" />
          <LogItem text="New relationship milestone reached: 'Loyal Partner'" time="1h ago" />
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
