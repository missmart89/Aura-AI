export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  app: string;
  title: string;
  content: string;
  timestamp: Date;
}

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  status: 'running' | 'closed';
}

export const mockContacts: Contact[] = [
  { id: '1', name: 'Alex Rivera', phone: '+1 555-0101', email: 'alex@example.com' },
  { id: '2', name: 'Jordan Smith', phone: '+1 555-0102', email: 'jordan@example.com' },
  { id: '3', name: 'Casey Jones', phone: '+1 555-0103', email: 'casey@example.com' },
];

export const mockNotifications: Notification[] = [
  { id: '1', app: 'Mail', title: 'New Message', content: 'Meeting at 3 PM today.', timestamp: new Date() },
  { id: '2', app: 'Messages', title: 'Jordan', content: 'Hey, are you free tonight?', timestamp: new Date() },
  { id: '3', app: 'Calendar', title: 'Reminder', content: 'Pick up groceries.', timestamp: new Date() },
];

export const mockApps: AppInfo[] = [
  { id: '1', name: 'Mail', icon: 'Mail', status: 'closed' },
  { id: '2', name: 'Calendar', icon: 'Calendar', status: 'closed' },
  { id: '3', name: 'Notes', icon: 'FileText', status: 'closed' },
  { id: '4', name: 'Code', icon: 'Code', status: 'closed' },
];

export async function makeCall(phoneNumber: string) {
  console.log(`Aura: Initiating secure call to ${phoneNumber}...`);
  // In a real mobile app, this would use a native bridge.
  // For this web interface, we'll simulate the connection.
  return { status: 'connected', duration: '00:00' };
}

export async function sendTextMessage(phoneNumber: string, message: string) {
  console.log(`Aura: Sending encrypted message to ${phoneNumber}: ${message}`);
  return { status: 'sent', timestamp: new Date() };
}

export async function readAloud(text: string) {
  // This will be handled by the Gemini TTS service in the component
  console.log(`Aura: Reading aloud: ${text}`);
}
