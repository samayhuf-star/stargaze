import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { Observer } from '../sky/types';

/** Used until a GPS fix arrives, or when permission is denied. */
export const FALLBACK_OBSERVER: Observer = { lat: 28.6139, lon: 77.209 };

export type ObserverState = {
  observer: Observer;
  source: 'gps' | 'default';
  permission: 'unknown' | 'granted' | 'denied';
};

export function useObserver(): ObserverState {
  const [state, setState] = useState<ObserverState>({ observer: FALLBACK_OBSERVER, source: 'default', permission: 'unknown' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!perm.granted) {
          setState((s) => ({ ...s, permission: 'denied' }));
          return;
        }
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          setState({ observer: { lat: last.coords.latitude, lon: last.coords.longitude }, source: 'gps', permission: 'granted' });
        }
        const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setState({ observer: { lat: fix.coords.latitude, lon: fix.coords.longitude }, source: 'gps', permission: 'granted' });
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, permission: s.permission === 'unknown' ? 'denied' : s.permission }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
