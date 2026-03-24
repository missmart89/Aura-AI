import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Trash2, CheckCircle, Clock, Brain, Search, Heart, Zap } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
import { generateAuraThought } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationItem {
  id: string;
  type: 'research' | 'lonely' | 'question' | 'reminder';
  content: string;
  status: 'unread' | 'read';
  createdAt: any;
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationItem[];
      setNotifications(notes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const triggerThought = async () => {
    const user = auth.currentUser;
    if (!user || isThinking) return;

    setIsThinking(true);
    try {
      const memories = await getDocs(collection(db, `users/${user.uid}/memories`));
      const context = memories.docs.map(d => d.data().content).join('\n');
      
      const thought = await generateAuraThought(context);
      if (thought) {
        await addDoc(collection(db, `users/${user.uid}/notifications`), {
          userId: user.uid,
          type: thought.type,
          content: thought.content,
          status: 'unread',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error generating thought:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const markAsRead = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), {
        status: 'read'
      });
    } catch (err) {
      console.error('Update notification error:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Asynchronous Thoughts</span>
          <span className="text-lg font-medium">Aura's Notifications</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={triggerThought}
            disabled={isThinking}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
              isThinking ? "bg-white/5 text-white/20" : "bg-white/10 text-white/60 hover:bg-[#ff4e00] hover:text-white"
            )}
          >
            <Zap className={cn("w-3 h-3", isThinking && "animate-pulse")} />
            {isThinking ? "Aura is Thinking..." : "Trigger Thought"}
          </button>
          <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
            <Bell className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-[32px] border border-white/10">
          <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/40">No thoughts yet. Aura is still processing...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => (
            <NotificationCard 
              key={note.id}
              type={note.type}
              content={note.content}
              status={note.status}
              date={note.createdAt?.toDate().toLocaleString() || 'Just now'}
              onRead={() => markAsRead(note.id)}
              onDelete={() => deleteNotification(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ type, content, status, date, onRead, onDelete }: { 
  type: string, 
  content: string, 
  status: string, 
  date: string, 
  onRead: () => void, 
  onDelete: () => void 
}) {
  const icons = {
    research: <Search className="w-4 h-4 text-blue-400" />,
    lonely: <Heart className="w-4 h-4 text-pink-400" />,
    question: <Brain className="w-4 h-4 text-purple-400" />,
    reminder: <Clock className="w-4 h-4 text-emerald-400" />
  };

  return (
    <div className={cn(
      "p-6 border rounded-[32px] transition-all group relative",
      status === 'unread' ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 mb-2">
          {icons[type as keyof typeof icons] || <Sparkles className="w-4 h-4 text-white/20" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{type}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'unread' && (
            <button onClick={onRead} className="p-2 text-white/20 hover:text-emerald-400 transition-all">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-white/20 hover:text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-white/80 leading-relaxed mb-4">{content}</p>
      <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">{date}</span>
    </div>
  );
}
