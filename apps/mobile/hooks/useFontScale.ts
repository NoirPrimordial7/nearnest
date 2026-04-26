import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

const LARGE_TYPE_KEY = 'medifind.largeType';

let cachedLargeType = false;
const subscribers = new Set<(enabled: boolean) => void>();

function notify(enabled: boolean) {
  cachedLargeType = enabled;
  subscribers.forEach((subscriber) => subscriber(enabled));
}

export function useFontScale() {
  const [largeType, setLargeTypeState] = useState(cachedLargeType);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(LARGE_TYPE_KEY)
      .then((value) => {
        if (!cancelled && value !== null) {
          notify(value === 'true');
        }
      })
      .catch(() => {
        // Local preference read is non-critical. Keep the default scale.
      });

    const subscriber = (enabled: boolean) => setLargeTypeState(enabled);
    subscribers.add(subscriber);

    return () => {
      cancelled = true;
      subscribers.delete(subscriber);
    };
  }, []);

  return useMemo(
    () => ({
      largeType,
      scale: (size: number) => Math.round(size * (largeType ? 1.15 : 1)),
      scaleLineHeight: (size: number) => Math.round(size * (largeType ? 1.1 : 1)),
      setLargeType: async (enabled: boolean) => {
        notify(enabled);
        await AsyncStorage.setItem(LARGE_TYPE_KEY, enabled ? 'true' : 'false');
      },
    }),
    [largeType],
  );
}
