import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface BusySlot {
  start: string;
  end: string;
}

export const getBusySlots = async (date: string): Promise<BusySlot[]> => {
  try {
    // First ensure user is signed in and we have their email
    const signInResult = await GoogleSignin.signInSilently();
    const userInfo = await GoogleSignin.getCurrentUser();
    const userEmail = userInfo?.user?.email;

    if (!userEmail) {
      throw new Error('User email not found. Please sign out and sign in again.');
    }

    const { accessToken } = await GoogleSignin.getTokens();

    // Get time range for the specific day (midnight to midnight)
    const timeMin = new Date(date);
    timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(date);
    timeMax.setHours(23, 59, 59, 999);

    const url = 'https://www.googleapis.com/calendar/v3/freeBusy';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: userEmail }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch busy slots: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const busySlots = data.calendars[userEmail].busy || [];
    return busySlots.map((slot: BusySlot) => ({
      start: new Date(slot.start).toLocaleTimeString(),
      end: new Date(slot.end).toLocaleTimeString()
    }));
  } catch (error) {
    throw error;
  }
}; 