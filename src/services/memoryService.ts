import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface MemoryItem {
  id?: string;
  type: 'note' | 'conversation' | 'code' | 'schedule' | 'moment';
  title?: string;
  topic?: string;
  content: string;
  createdAt: Date;
  tags?: string[];
  importance?: number;
  userId?: string;
}

export const mockMemories: MemoryItem[] = [
  { 
    id: '1', 
    type: 'note', 
    title: 'Project Aura Goals', 
    content: 'Build a loyal, real, and honest AI partner. Focus on multi-modal integration and deep personality.', 
    createdAt: new Date(),
    tags: ['aura', 'vision']
  },
  { 
    id: '2', 
    type: 'schedule', 
    title: 'Daily Routine', 
    content: '08:00 - Wake up\n09:00 - Deep work\n12:00 - Lunch with Aura\n15:00 - System optimization', 
    createdAt: new Date(),
    tags: ['schedule', 'routine']
  },
  { 
    id: '3', 
    type: 'code', 
    title: 'Neural Bridge v1', 
    content: 'const aura = new Aura();\naura.connect(user);\naura.evolve();', 
    createdAt: new Date(),
    tags: ['code', 'dev']
  },
];

export async function saveMemory(memory: Omit<MemoryItem, 'id'>) {
  if (!auth.currentUser) return null;
  
  try {
    const docRef = await addDoc(collection(db, 'users', auth.currentUser.uid, 'memories'), {
      ...memory,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.fromDate(memory.createdAt)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving memory:', error);
    return null;
  }
}

export async function getMemories(type?: MemoryItem['type']) {
  if (!auth.currentUser) return [];
  
  try {
    let q = query(
      collection(db, 'users', auth.currentUser.uid, 'memories'), 
      orderBy('createdAt', 'desc')
    );
    
    if (type) {
      q = query(q, where('type', '==', type));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? (doc.data().createdAt as Timestamp).toDate() : new Date()
    })) as MemoryItem[];
  } catch (error) {
    console.error('Error getting memories:', error);
    return [];
  }
}

export async function searchMemories(keyword: string) {
  const memories = await getMemories();
  return memories.filter(m => {
    const titleMatch = m.title?.toLowerCase().includes(keyword.toLowerCase()) || m.topic?.toLowerCase().includes(keyword.toLowerCase());
    const contentMatch = m.content?.toLowerCase().includes(keyword.toLowerCase());
    const tagMatch = m.tags?.some(t => t.toLowerCase().includes(keyword.toLowerCase()));
    return titleMatch || contentMatch || tagMatch;
  });
}
