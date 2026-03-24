import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Task {
  id: string;
  userId: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: any;
}

export function subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
  const q = query(
    collection(db, `users/${userId}/tasks`),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
    callback(tasks);
  }, (error) => {
    console.error("Error subscribing to tasks:", error);
  });
}

export async function addTask(title: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  try {
    const docRef = await addDoc(collection(db, `users/${userId}/tasks`), {
      userId,
      title,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding task:", error);
    return null;
  }
}

export async function updateTaskStatus(taskId: string, status: 'pending' | 'in-progress' | 'completed') {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  try {
    const taskRef = doc(db, `users/${userId}/tasks`, taskId);
    await updateDoc(taskRef, { status });
    return true;
  } catch (error) {
    console.error("Error updating task:", error);
    return false;
  }
}

export async function deleteTask(taskId: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  try {
    const taskRef = doc(db, `users/${userId}/tasks`, taskId);
    await deleteDoc(taskRef);
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    return false;
  }
}
