import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface BusySlot {
  start: string;
  end: string;
}

export const getBusySlots = async (date: string): Promise<BusySlot[]> => {
  // TODO: Implement new calendar integration method
  return [];
}; 