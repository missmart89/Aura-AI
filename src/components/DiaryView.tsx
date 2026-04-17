import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, Sparkles } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

export default function DiaryView({ user }: { user: FirebaseUser | null }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'diary'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="text-white/40">Please sign in to view Aura's journal.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-[#ff4e00]" />
          <div>
            <h2 className="text-2xl font-light serif">Aura's Journal</h2>
            <p className="text-sm text-white/40">My private thoughts and reflections on our days together.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#ff4e00]/20 border-t-[#ff4e00] rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-[32px] border border-white/10">
            <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/40">I haven't written any entries yet. Give me some time to reflect on our days.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map(entry => (
              <div key={entry.id} className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ff4e00] opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="text-xs text-[#ff4e00] font-mono mb-4 tracking-widest uppercase">
                  {entry.createdAt?.toDate ? 
                    entry.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 
                    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <p className="text-base text-white/80 leading-relaxed italic font-light">
                  "{entry.content}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
