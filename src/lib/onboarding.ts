import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'stargaze.onboarded.v1';

/** null while loading, then whether the first-run flow has been completed. */
export function useOnboarded(): boolean | null {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((v) => active && setDone(v === '1'))
      // If storage is unreadable, show the sky rather than trapping the user in onboarding.
      .catch(() => active && setDone(true));
    return () => {
      active = false;
    };
  }, []);
  return done;
}

export async function markOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Not fatal: the flow simply shows again next launch.
  }
}
