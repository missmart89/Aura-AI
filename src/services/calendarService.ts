export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  link?: string;
}

let tokenClient: any;
let accessToken: string | null = null;

export function initGoogleCalendar(clientId: string, onReady: () => void) {
  // Load the Google Identity Services script
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          onReady();
        }
      },
    });
  };
  document.body.appendChild(script);
}

export function requestCalendarAccess() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    console.error("Google Identity Services not initialized.");
  }
}

export async function fetchUpcomingEvents(): Promise<CalendarEvent[]> {
  if (!accessToken) {
    throw new Error("Not authenticated with Google Calendar.");
  }

  const timeMin = new Date().toISOString();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 7); // Next 7 days

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax.toISOString())}&singleEvents=true&orderBy=startTime&maxResults=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch calendar events.");
  }

  const data = await response.json();
  
  return data.items.map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    start: item.start.dateTime || item.start.date,
    end: item.end.dateTime || item.end.date,
    link: item.htmlLink,
  }));
}
